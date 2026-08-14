from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, UserRole, Customer, Account, Transaction, Loan, LoanPayment, CreditProfile, LoanStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_total_paid_principal(db: Session, loan_id: int):
    total_paid = (
        db.query(
            func.coalesce(
                func.sum(LoanPayment.amount_paid),
                0
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


def get_outstanding_principal(db: Session, loan: Loan):
    if loan.loan_status not in [
        LoanStatus.active,
        LoanStatus.overdue,
    ]:
        return Decimal("0")

    paid_principal = get_total_paid_principal(
        db,
        loan.id
    )

    outstanding = (
        Decimal(str(loan.loan_amount))
        - paid_principal
    )

    return max(
        outstanding,
        Decimal("0")
    )


@router.get("/me")
def dashboard_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ========================================================
    # ADMIN
    # ========================================================

    if current_user.role == UserRole.admin:
        return {
            "mode": "admin",
            "customers_count": db.query(Customer).count(),
            "accounts_count": db.query(Account).count(),
            "transactions_count": db.query(Transaction).count(),
            "loans_count": db.query(Loan).count(),
            "total_balance": db.query(
                func.coalesce(
                    func.sum(Account.balance),
                    0
                )
            ).scalar()
        }


    # ========================================================
    # CUSTOMER
    # ========================================================

    customer = (
        db.query(Customer)
        .filter(
            Customer.user_id == current_user.id
        )
        .first()
    )


    if not customer:
        return {
            "mode": "user",
            "profile_complete": False,
            "customer": None,

            "financial_summary": {
                "total_balance": Decimal("0"),
                "available_balance": Decimal("0"),

                "total_requested_loan_amount": Decimal("0"),

                "pending_loan_amount": Decimal("0"),

                "approved_not_disbursed_amount": Decimal("0"),

                "total_outstanding_principal": Decimal("0"),

                "overdue_outstanding_principal": Decimal("0"),
            },

            "accounts": [],
            "recent_transactions": [],
            "loans": [],
            "credit_profile": None,
        }


    # ========================================================
    # ACCOUNTS
    # ========================================================

    accounts = (
        db.query(Account)
        .filter(
            Account.customer_id == customer.id
        )
        .all()
    )


    account_ids = [
        account.id
        for account in accounts
    ]


    total_balance = sum(
        (
            Decimal(str(account.balance or 0))
            for account in accounts
            if account.currency == "VND"
        ),
        Decimal("0")
    )


    available_balance = sum(
        (
            Decimal(str(account.available_balance or 0))
            for account in accounts
            if account.currency == "VND"
        ),
        Decimal("0")
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
            .limit(8)
            .all()
        )


    # ========================================================
    # LOANS
    # ========================================================

    loans = (
        db.query(Loan)
        .filter(
            Loan.customer_id == customer.id
        )
        .order_by(
            Loan.created_at.desc()
        )
        .all()
    )


    total_requested_loan_amount = Decimal("0")

    pending_loan_amount = Decimal("0")

    approved_not_disbursed_amount = Decimal("0")

    total_outstanding_principal = Decimal("0")

    overdue_outstanding_principal = Decimal("0")


    loan_rows = []


    for loan in loans:
        loan_amount = Decimal(
            str(loan.loan_amount or 0)
        )


        total_requested_loan_amount += loan_amount


        paid_principal = (
            get_total_paid_principal(
                db,
                loan.id
            )
        )


        outstanding_principal = (
            get_outstanding_principal(
                db,
                loan
            )
        )


        if loan.loan_status == LoanStatus.pending:
            pending_loan_amount += loan_amount


        elif loan.loan_status == LoanStatus.approved:
            approved_not_disbursed_amount += loan_amount


        elif loan.loan_status == LoanStatus.active:
            total_outstanding_principal += (
                outstanding_principal
            )


        elif loan.loan_status == LoanStatus.overdue:
            total_outstanding_principal += (
                outstanding_principal
            )

            overdue_outstanding_principal += (
                outstanding_principal
            )


        loan_rows.append({
            "id": loan.id,

            "loan_code": loan.loan_code,

            "loan_amount": loan.loan_amount,

            "paid_principal": paid_principal,

            "outstanding_principal": outstanding_principal,

            "interest_rate": loan.interest_rate,

            "loan_term": loan.loan_term,

            "loan_status": loan.loan_status.value,

            "purpose": loan.purpose,

            "start_date": loan.start_date,

            "end_date": loan.end_date,

            "created_at": loan.created_at,
        })


    # ========================================================
    # CREDIT PROFILE
    # ========================================================

    credit = (
        db.query(CreditProfile)
        .filter(
            CreditProfile.customer_id == customer.id
        )
        .first()
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "mode": "user",

        "profile_complete": True,


        "customer": {
            "id": customer.id,

            "customer_code": customer.customer_code,

            "full_name": customer.full_name,

            "phone": customer.phone,

            "email": customer.email,

            "bad_debt": customer.bad_debt,
        },


        "financial_summary": {
            "total_balance": total_balance,

            "available_balance": available_balance,

            "total_requested_loan_amount": total_requested_loan_amount,

            "pending_loan_amount": pending_loan_amount,

            "approved_not_disbursed_amount": approved_not_disbursed_amount,

            "total_outstanding_principal": total_outstanding_principal,

            "overdue_outstanding_principal": overdue_outstanding_principal,
        },


        "accounts": [
            {
                "id": account.id,

                "account_number": account.account_number,

                "account_type": account.account_type.value,

                "currency": account.currency,

                "balance": account.balance,

                "available_balance": account.available_balance,

                "status": account.status.value,
            }

            for account
            in accounts
        ],


        "recent_transactions": [
            {
                "id": transaction.id,

                "transaction_code": transaction.transaction_code,

                "from_account_id": transaction.from_account_id,

                "to_account_id": transaction.to_account_id,

                "amount": transaction.amount,

                "currency": transaction.currency,

                "transaction_type": transaction.transaction_type.value,

                "status": transaction.status.value,

                "description": transaction.description,

                "created_at": transaction.created_at,
            }

            for transaction
            in transactions
        ],


        "loans": loan_rows,


        "credit_profile": (
            None
            if not credit
            else {
                "credit_score": credit.credit_score,

                "debt_ratio": credit.debt_ratio,

                "total_debt": credit.total_debt,

                "late_payment_count": credit.late_payment_count,
            }
        ),
    }