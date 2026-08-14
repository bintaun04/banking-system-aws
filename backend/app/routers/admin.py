from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import get_current_admin
from app.models import User, Customer, Account, Transaction, Loan, LoanPayment, CreditProfile, Prediction, Branch, AuditLog, LoanStatus, TransactionStatus, RiskLevel

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# HELPERS
# ============================================================

def get_total_paid_principal(
    db: Session,
    loan_id: int,
):
    total_paid = (
        db.query(
            func.coalesce(
                func.sum(
                    LoanPayment.amount_paid
                ),
                0,
            )
        )
        .filter(
            LoanPayment.loan_id == loan_id
        )
        .scalar()
    )

    return Decimal(
        str(total_paid or 0)
    )


def get_outstanding_principal(
    db: Session,
    loan: Loan,
):
    """
    Dư nợ gốc chỉ tồn tại khi khoản vay đã giải ngân.

    pending:
        chưa duyệt -> 0

    approved:
        đã duyệt nhưng chưa giải ngân -> 0

    active:
        đã giải ngân -> loan_amount - principal paid

    overdue:
        vẫn còn dư nợ -> loan_amount - principal paid

    rejected:
        không phát sinh dư nợ -> 0

    closed:
        đã tất toán -> 0
    """

    if loan.loan_status not in [
        LoanStatus.active,
        LoanStatus.overdue,
    ]:
        return Decimal("0")

    paid_principal = (
        get_total_paid_principal(
            db,
            loan.id,
        )
    )

    outstanding = (
        Decimal(
            str(loan.loan_amount)
        )
        - paid_principal
    )

    if outstanding < 0:
        return Decimal("0")

    return outstanding


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    # ========================================================
    # BASIC COUNTS
    # ========================================================

    customers_count = (
        db.query(Customer)
        .count()
    )

    accounts_count = (
        db.query(Account)
        .count()
    )

    transactions_count = (
        db.query(Transaction)
        .count()
    )

    loans_count = (
        db.query(Loan)
        .count()
    )

    branches_count = (
        db.query(Branch)
        .count()
    )


    # ========================================================
    # ACCOUNT BALANCE
    # Tổng số dư tiền gửi
    # ========================================================

    total_balance = (
        db.query(
            func.coalesce(
                func.sum(
                    Account.balance
                ),
                0,
            )
        )
        .filter(
            Account.currency == "VND"
        )
        .scalar()
    )


    total_available_balance = (
        db.query(
            func.coalesce(
                func.sum(
                    Account.available_balance
                ),
                0,
            )
        )
        .filter(
            Account.currency == "VND"
        )
        .scalar()
    )


    total_balance = Decimal(
        str(total_balance or 0)
    )

    total_available_balance = Decimal(
        str(
            total_available_balance
            or 0
        )
    )


    # ========================================================
    # BAD DEBT
    # ========================================================

    bad_debt_count = (
        db.query(Customer)
        .filter(
            Customer.bad_debt.is_(
                True
            )
        )
        .count()
    )


    bad_debt_rate = 0

    if customers_count > 0:
        bad_debt_rate = round(
            (
                bad_debt_count
                / customers_count
            )
            * 100,
            2,
        )


    # ========================================================
    # TRANSACTION STATUS
    # ========================================================

    failed_transactions_count = (
        db.query(Transaction)
        .filter(
            Transaction.status
            == TransactionStatus.failed
        )
        .count()
    )


    # ========================================================
    # ML RISK
    # ========================================================

    high_risk_count = (
        db.query(Prediction)
        .filter(
            Prediction.risk_level
            == RiskLevel.HIGH
        )
        .count()
    )


    # ========================================================
    # LOAN STATISTICS
    # ========================================================

    loans = (
        db.query(Loan)
        .all()
    )


    total_requested_loan_amount = Decimal(
        "0"
    )

    pending_loan_amount = Decimal(
        "0"
    )

    approved_not_disbursed_amount = Decimal(
        "0"
    )

    total_outstanding_principal = Decimal(
        "0"
    )

    overdue_outstanding_principal = Decimal(
        "0"
    )


    pending_loans_count = 0

    approved_loans_count = 0

    active_loans_count = 0

    overdue_loans_count = 0

    rejected_loans_count = 0

    closed_loans_count = 0


    for loan in loans:
        loan_amount = Decimal(
            str(
                loan.loan_amount
                or 0
            )
        )


        # Tổng giá trị tất cả hồ sơ vay
        total_requested_loan_amount += (
            loan_amount
        )


        # -----------------------------------------------
        # PENDING
        # -----------------------------------------------

        if (
            loan.loan_status
            == LoanStatus.pending
        ):
            pending_loans_count += 1

            pending_loan_amount += (
                loan_amount
            )


        # -----------------------------------------------
        # APPROVED
        # Đã duyệt nhưng chưa giải ngân
        # -----------------------------------------------

        elif (
            loan.loan_status
            == LoanStatus.approved
        ):
            approved_loans_count += 1

            approved_not_disbursed_amount += (
                loan_amount
            )


        # -----------------------------------------------
        # ACTIVE
        # Đã giải ngân
        # -----------------------------------------------

        elif (
            loan.loan_status
            == LoanStatus.active
        ):
            active_loans_count += 1

            outstanding = (
                get_outstanding_principal(
                    db,
                    loan,
                )
            )

            total_outstanding_principal += (
                outstanding
            )


        # -----------------------------------------------
        # OVERDUE
        # -----------------------------------------------

        elif (
            loan.loan_status
            == LoanStatus.overdue
        ):
            overdue_loans_count += 1

            outstanding = (
                get_outstanding_principal(
                    db,
                    loan,
                )
            )

            total_outstanding_principal += (
                outstanding
            )

            overdue_outstanding_principal += (
                outstanding
            )


        # -----------------------------------------------
        # REJECTED
        # -----------------------------------------------

        elif (
            loan.loan_status
            == LoanStatus.rejected
        ):
            rejected_loans_count += 1


        # -----------------------------------------------
        # CLOSED
        # -----------------------------------------------

        elif (
            loan.loan_status
            == LoanStatus.closed
        ):
            closed_loans_count += 1


    # ========================================================
    # RECENT TRANSACTIONS
    # ========================================================

    recent_transactions = (
        db.query(Transaction)
        .order_by(
            Transaction.created_at.desc()
        )
        .limit(10)
        .all()
    )


    # ========================================================
    # RECENT LOANS
    # ========================================================

    recent_loans = (
        db.query(Loan)
        .order_by(
            Loan.created_at.desc()
        )
        .limit(10)
        .all()
    )


    recent_loan_rows = []


    for loan in recent_loans:
        paid_principal = (
            get_total_paid_principal(
                db,
                loan.id,
            )
        )

        outstanding_principal = (
            get_outstanding_principal(
                db,
                loan,
            )
        )

        customer = (
            db.query(Customer)
            .filter(
                Customer.id
                == loan.customer_id
            )
            .first()
        )


        recent_loan_rows.append({
            "id":
                loan.id,

            "loan_code":
                loan.loan_code,

            "customer_id":
                loan.customer_id,

            "customer_code":
                (
                    customer.customer_code
                    if customer
                    else None
                ),

            "customer_name":
                (
                    customer.full_name
                    if customer
                    else None
                ),

            "loan_amount":
                loan.loan_amount,

            "paid_principal":
                paid_principal,

            "outstanding_principal":
                outstanding_principal,

            "interest_rate":
                loan.interest_rate,

            "loan_term":
                loan.loan_term,

            "purpose":
                loan.purpose,

            "loan_status":
                loan.loan_status.value,

            "start_date":
                loan.start_date,

            "end_date":
                loan.end_date,

            "created_at":
                loan.created_at,
        })


    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        # ====================================================
        # BASIC
        # ====================================================

        "customers_count":
            customers_count,

        "accounts_count":
            accounts_count,

        "transactions_count":
            transactions_count,

        "loans_count":
            loans_count,

        "branches_count":
            branches_count,


        # ====================================================
        # ACCOUNT MONEY
        # ====================================================

        "total_balance":
            total_balance,

        "total_available_balance":
            total_available_balance,


        # ====================================================
        # LOAN MONEY
        # ====================================================

        "total_requested_loan_amount":
            total_requested_loan_amount,

        "pending_loan_amount":
            pending_loan_amount,

        "approved_not_disbursed_amount":
            approved_not_disbursed_amount,

        "total_outstanding_principal":
            total_outstanding_principal,

        "overdue_outstanding_principal":
            overdue_outstanding_principal,


        # ====================================================
        # LOAN COUNTS
        # ====================================================

        "pending_loans_count":
            pending_loans_count,

        "approved_loans_count":
            approved_loans_count,

        "active_loans_count":
            active_loans_count,

        "overdue_loans_count":
            overdue_loans_count,

        "rejected_loans_count":
            rejected_loans_count,

        "closed_loans_count":
            closed_loans_count,


        # ====================================================
        # RISK
        # ====================================================

        "bad_debt_count":
            bad_debt_count,

        "bad_debt_rate":
            bad_debt_rate,

        "failed_transactions_count":
            failed_transactions_count,

        "high_risk_count":
            high_risk_count,


        # ====================================================
        # RECENT TRANSACTIONS
        # ====================================================

        "recent_transactions": [
            {
                "id":
                    tx.id,

                "transaction_code":
                    tx.transaction_code,

                "from_account_id":
                    tx.from_account_id,

                "to_account_id":
                    tx.to_account_id,

                "amount":
                    tx.amount,

                "currency":
                    tx.currency,

                "transaction_type":
                    tx.transaction_type.value,

                "status":
                    tx.status.value,

                "description":
                    tx.description,

                "created_at":
                    tx.created_at,
            }

            for tx
            in recent_transactions
        ],


        # ====================================================
        # RECENT LOANS
        # ====================================================

        "recent_loans":
            recent_loan_rows,
    }


# ============================================================
# CUSTOMER OVERVIEW
# Admin xem toàn bộ dữ liệu của một khách hàng
# ============================================================

@router.get(
    "/customers/{customer_id}/overview"
)
def customer_overview(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    # ========================================================
    # CUSTOMER
    # ========================================================

    customer = (
        db.query(Customer)
        .filter(
            Customer.id
            == customer_id
        )
        .first()
    )


    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )


    # ========================================================
    # ACCOUNTS
    # ========================================================

    accounts = (
        db.query(Account)
        .filter(
            Account.customer_id
            == customer_id
        )
        .all()
    )


    account_ids = [
        account.id
        for account
        in accounts
    ]


    customer_total_balance = sum(
        Decimal(
            str(
                account.balance
                or 0
            )
        )
        for account
        in accounts
        if account.currency == "VND"
    )


    customer_available_balance = sum(
        Decimal(
            str(
                account.available_balance
                or 0
            )
        )
        for account
        in accounts
        if account.currency == "VND"
    )


    # ========================================================
    # TRANSACTIONS
    # ========================================================

    transactions = []


    if account_ids:
        transactions = (
            db.query(Transaction)
            .filter(
                or_(
                    Transaction.from_account_id.in_(
                        account_ids
                    ),

                    Transaction.to_account_id.in_(
                        account_ids
                    ),
                )
            )
            .order_by(
                Transaction.created_at.desc()
            )
            .limit(50)
            .all()
        )


    # ========================================================
    # LOANS
    # ========================================================

    loans = (
        db.query(Loan)
        .filter(
            Loan.customer_id
            == customer_id
        )
        .order_by(
            Loan.created_at.desc()
        )
        .all()
    )


    customer_outstanding_principal = Decimal(
        "0"
    )


    customer_overdue_outstanding = Decimal(
        "0"
    )


    loan_rows = []


    for loan in loans:
        paid_principal = (
            get_total_paid_principal(
                db,
                loan.id,
            )
        )

        outstanding_principal = (
            get_outstanding_principal(
                db,
                loan,
            )
        )


        if loan.loan_status in [
            LoanStatus.active,
            LoanStatus.overdue,
        ]:
            customer_outstanding_principal += (
                outstanding_principal
            )


        if (
            loan.loan_status
            == LoanStatus.overdue
        ):
            customer_overdue_outstanding += (
                outstanding_principal
            )


        loan_rows.append({
            "id":
                loan.id,

            "loan_code":
                loan.loan_code,

            "loan_amount":
                loan.loan_amount,

            "paid_principal":
                paid_principal,

            "outstanding_principal":
                outstanding_principal,

            "interest_rate":
                loan.interest_rate,

            "loan_term":
                loan.loan_term,

            "purpose":
                loan.purpose,

            "loan_status":
                loan.loan_status.value,

            "start_date":
                loan.start_date,

            "end_date":
                loan.end_date,

            "created_at":
                loan.created_at,

            "updated_at":
                loan.updated_at,
        })


    # ========================================================
    # CREDIT PROFILE
    # ========================================================

    credit_profile = (
        db.query(CreditProfile)
        .filter(
            CreditProfile.customer_id
            == customer_id
        )
        .first()
    )


    # ========================================================
    # PREDICTIONS
    # ========================================================

    predictions = (
        db.query(Prediction)
        .filter(
            Prediction.customer_id
            == customer_id
        )
        .order_by(
            Prediction.created_at.desc()
        )
        .all()
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "customer": {
            "id":
                customer.id,

            "user_id":
                customer.user_id,

            "customer_code":
                customer.customer_code,

            "full_name":
                customer.full_name,

            "date_of_birth":
                customer.date_of_birth,

            "gender":
                (
                    customer.gender.value
                    if customer.gender
                    else None
                ),

            "phone":
                customer.phone,

            "email":
                customer.email,

            "permanent_address":
                customer.permanent_address,

            "national_id":
                customer.national_id,

            "occupation":
                customer.occupation,

            "monthly_income":
                customer.monthly_income,

            "bad_debt":
                customer.bad_debt,

            "created_at":
                customer.created_at,
        },


        # ====================================================
        # CUSTOMER FINANCIAL SUMMARY
        # ====================================================

        "financial_summary": {
            "total_balance":
                customer_total_balance,

            "available_balance":
                customer_available_balance,

            "outstanding_principal":
                customer_outstanding_principal,

            "overdue_outstanding":
                customer_overdue_outstanding,
        },


        # ====================================================
        # ACCOUNTS
        # ====================================================

        "accounts": [
            {
                "id":
                    account.id,

                "account_number":
                    account.account_number,

                "account_type":
                    account.account_type.value,

                "currency":
                    account.currency,

                "balance":
                    account.balance,

                "available_balance":
                    account.available_balance,

                "transaction_limit":
                    account.transaction_limit,

                "interest_rate":
                    account.interest_rate,

                "status":
                    account.status.value,

                "branch_id":
                    account.branch_id,

                "opened_at":
                    account.opened_at,
            }

            for account
            in accounts
        ],


        # ====================================================
        # TRANSACTIONS
        # ====================================================

        "transactions": [
            {
                "id":
                    tx.id,

                "transaction_code":
                    tx.transaction_code,

                "from_account_id":
                    tx.from_account_id,

                "to_account_id":
                    tx.to_account_id,

                "amount":
                    tx.amount,

                "currency":
                    tx.currency,

                "transaction_type":
                    tx.transaction_type.value,

                "status":
                    tx.status.value,

                "description":
                    tx.description,

                "created_at":
                    tx.created_at,
            }

            for tx
            in transactions
        ],


        # ====================================================
        # LOANS
        # ====================================================

        "loans":
            loan_rows,


        # ====================================================
        # CREDIT
        # ====================================================

        "credit_profile": (
            None
            if not credit_profile
            else {
                "id":
                    credit_profile.id,

                "credit_score":
                    credit_profile.credit_score,

                "debt_ratio":
                    credit_profile.debt_ratio,

                "total_debt":
                    credit_profile.total_debt,

                "credit_history_length":
                    credit_profile.credit_history_length,

                "previous_default":
                    credit_profile.previous_default,

                "late_payment_count":
                    credit_profile.late_payment_count,

                "total_loans":
                    credit_profile.total_loans,

                "updated_at":
                    credit_profile.updated_at,
            }
        ),


        # ====================================================
        # ML PREDICTIONS
        # ====================================================

        "predictions": [
            {
                "id":
                    prediction.id,

                "model_name":
                    prediction.model_name,

                "model_version":
                    prediction.model_version,

                "risk_probability":
                    prediction.risk_probability,

                "risk_level":
                    (
                        prediction.risk_level.value
                        if prediction.risk_level
                        else None
                    ),

                "created_at":
                    prediction.created_at,
            }

            for prediction
            in predictions
        ],
    }


# ============================================================
# ALL CREDIT PROFILES
# ============================================================

@router.get("/credits")
def admin_credit_profiles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    credits = (
        db.query(
            CreditProfile,
            Customer,
        )
        .join(
            Customer,
            Customer.id
            == CreditProfile.customer_id,
        )
        .order_by(
            CreditProfile.updated_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


    return [
        {
            "id":
                credit.id,

            "customer_id":
                customer.id,

            "customer_code":
                customer.customer_code,

            "customer_name":
                customer.full_name,

            "credit_score":
                credit.credit_score,

            "debt_ratio":
                credit.debt_ratio,

            "total_debt":
                credit.total_debt,

            "credit_history_length":
                credit.credit_history_length,

            "previous_default":
                credit.previous_default,

            "late_payment_count":
                credit.late_payment_count,

            "total_loans":
                credit.total_loans,

            "bad_debt":
                customer.bad_debt,

            "updated_at":
                credit.updated_at,
        }

        for credit, customer
        in credits
    ]


# ============================================================
# ALL PREDICTIONS
# ============================================================

@router.get("/predictions")
def admin_predictions(
    skip: int = 0,
    limit: int = 100,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    query = (
        db.query(
            Prediction,
            Customer,
        )
        .join(
            Customer,
            Customer.id
            == Prediction.customer_id,
        )
    )


    if risk_level:
        try:
            level = RiskLevel(
                risk_level.upper()
            )


            query = query.filter(
                Prediction.risk_level
                == level
            )

        except ValueError:
            raise HTTPException(
                status_code=400,

                detail=(
                    "risk_level must be "
                    "LOW, MEDIUM or HIGH"
                ),
            )


    rows = (
        query
        .order_by(
            Prediction.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


    return [
        {
            "id":
                prediction.id,

            "customer_id":
                customer.id,

            "customer_code":
                customer.customer_code,

            "customer_name":
                customer.full_name,

            "model_name":
                prediction.model_name,

            "model_version":
                prediction.model_version,

            "risk_probability":
                prediction.risk_probability,

            "risk_level":
                (
                    prediction.risk_level.value
                    if prediction.risk_level
                    else None
                ),

            "created_at":
                prediction.created_at,
        }

        for prediction, customer
        in rows
    ]


# ============================================================
# AUDIT LOGS
# ============================================================

@router.get("/audit-logs")
def admin_audit_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    query = db.query(
        AuditLog
    )


    if action:
        query = query.filter(
            AuditLog.action.ilike(
                f"%{action}%"
            )
        )


    if user_id:
        query = query.filter(
            AuditLog.user_id
            == user_id
        )


    logs = (
        query
        .order_by(
            AuditLog.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


    return [
        {
            "id":
                log.id,

            "user_id":
                log.user_id,

            "action":
                log.action,

            "resource":
                log.resource,

            "resource_id":
                log.resource_id,

            "ip_address":
                log.ip_address,

            "description":
                log.description,

            "created_at":
                log.created_at,
        }

        for log
        in logs
    ]