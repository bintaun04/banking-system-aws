import calendar
import uuid
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Loan, LoanPayment, Customer, Account, User, UserRole, LoanStatus, PaymentStatus, AccountStatus
from app.schemas import LoanCreate, LoanUpdate, LoanOut, LoanRepaymentCreate
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/loans", tags=["Loans"])


# ============================================================
# HELPERS
# ============================================================

def generate_loan_code():
    return "LOAN" + uuid.uuid4().hex[:20].upper()


def add_months(source_date: date, months: int):
    month_index = source_date.month - 1 + months

    year = source_date.year + month_index // 12
    month = month_index % 12 + 1

    day = min(
        source_date.day,
        calendar.monthrange(year, month)[1]
    )

    return date(
        year,
        month,
        day
    )


def get_total_paid_principal(db: Session, loan_id: int):
    total = (
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

    return Decimal(str(total or 0))


def get_outstanding_principal(db: Session, loan: Loan):
    if loan.loan_status not in [
        LoanStatus.active,
        LoanStatus.overdue,
    ]:
        return Decimal("0")

    paid = get_total_paid_principal(
        db,
        loan.id
    )

    outstanding = (
        Decimal(str(loan.loan_amount))
        - paid
    )

    return max(
        outstanding,
        Decimal("0")
    )


def check_loan_permission(db: Session, loan: Loan, current_user: User):
    if current_user.role == UserRole.admin:
        return

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == loan.customer_id
        )
        .first()
    )

    if (
        not customer
        or customer.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )


# ============================================================
# CREATE LOAN REQUEST
# ============================================================

@router.post("/", response_model=LoanOut, status_code=status.HTTP_201_CREATED)
def create_loan(loan_in: LoanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == loan_in.customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if (
        current_user.role != UserRole.admin
        and customer.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )

    account = (
        db.query(Account)
        .filter(
            Account.id == loan_in.disbursement_account_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Disbursement account not found"
        )

    if account.customer_id != customer.id:
        raise HTTPException(
            status_code=400,
            detail="Disbursement account does not belong to customer"
        )

    if account.status != AccountStatus.active:
        raise HTTPException(
            status_code=400,
            detail="Disbursement account is not active"
        )

    if account.currency != "VND":
        raise HTTPException(
            status_code=400,
            detail="Loan disbursement currently supports VND accounts only"
        )

    loan = Loan(
        loan_code=generate_loan_code(),
        customer_id=customer.id,
        disbursement_account_id=account.id,
        loan_amount=loan_in.loan_amount,
        interest_rate=loan_in.interest_rate,
        loan_term=loan_in.loan_term,
        purpose=loan_in.purpose,
        start_date=None,
        end_date=None,
        loan_status=LoanStatus.pending,
    )

    try:
        db.add(loan)
        db.commit()
        db.refresh(loan)

        return loan

    except Exception:
        db.rollback()
        raise


# ============================================================
# MY LOAN OVERVIEW
# QUAN TRỌNG: đặt trước /{loan_id}
# ============================================================

@router.get("/my/overview")
def my_loan_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = (
        db.query(Customer)
        .filter(
            Customer.user_id == current_user.id
        )
        .first()
    )

    if not customer:
        return {
            "summary": {
                "total_requested_amount": 0,
                "pending_amount": 0,
                "approved_not_disbursed_amount": 0,
                "outstanding_principal": 0,
                "overdue_outstanding": 0,
            },
            "loans": [],
        }

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

    total_requested_amount = Decimal("0")
    pending_amount = Decimal("0")
    approved_not_disbursed_amount = Decimal("0")
    outstanding_principal = Decimal("0")
    overdue_outstanding = Decimal("0")

    rows = []

    for loan in loans:
        loan_amount = Decimal(
            str(loan.loan_amount or 0)
        )

        total_requested_amount += loan_amount

        paid = get_total_paid_principal(
            db,
            loan.id
        )

        outstanding = get_outstanding_principal(
            db,
            loan
        )

        if loan.loan_status == LoanStatus.pending:
            pending_amount += loan_amount

        elif loan.loan_status == LoanStatus.approved:
            approved_not_disbursed_amount += loan_amount

        elif loan.loan_status == LoanStatus.active:
            outstanding_principal += outstanding

        elif loan.loan_status == LoanStatus.overdue:
            outstanding_principal += outstanding
            overdue_outstanding += outstanding

        account = None

        if loan.disbursement_account_id:
            account = (
                db.query(Account)
                .filter(
                    Account.id == loan.disbursement_account_id
                )
                .first()
            )

        rows.append({
            "id": loan.id,
            "loan_code": loan.loan_code,
            "customer_id": loan.customer_id,

            "disbursement_account_id":
                loan.disbursement_account_id,

            "disbursement_account_number":
                (
                    account.account_number
                    if account
                    else None
                ),

            "loan_amount": loan.loan_amount,

            "paid_principal": paid,

            "outstanding_principal":
                outstanding,

            "interest_rate":
                loan.interest_rate,

            "loan_term":
                loan.loan_term,

            "purpose":
                loan.purpose,

            "start_date":
                loan.start_date,

            "end_date":
                loan.end_date,

            "loan_status":
                loan.loan_status.value,

            "created_at":
                loan.created_at,
        })

    return {
        "summary": {
            "total_requested_amount":
                total_requested_amount,

            "pending_amount":
                pending_amount,

            "approved_not_disbursed_amount":
                approved_not_disbursed_amount,

            "outstanding_principal":
                outstanding_principal,

            "overdue_outstanding":
                overdue_outstanding,
        },

        "loans": rows,
    }


# ============================================================
# ADMIN LOAN OVERVIEW
# ============================================================

@router.get("/admin/overview")
def admin_loan_overview(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    loans = (
        db.query(Loan)
        .order_by(
            Loan.created_at.desc()
        )
        .all()
    )

    total_requested_amount = Decimal("0")
    pending_amount = Decimal("0")
    approved_not_disbursed_amount = Decimal("0")
    outstanding_principal = Decimal("0")
    overdue_outstanding = Decimal("0")

    pending_count = 0
    approved_count = 0
    active_count = 0
    overdue_count = 0
    rejected_count = 0
    closed_count = 0

    rows = []

    for loan in loans:
        customer = (
            db.query(Customer)
            .filter(
                Customer.id == loan.customer_id
            )
            .first()
        )

        account = None

        if loan.disbursement_account_id:
            account = (
                db.query(Account)
                .filter(
                    Account.id == loan.disbursement_account_id
                )
                .first()
            )

        amount = Decimal(
            str(loan.loan_amount or 0)
        )

        total_requested_amount += amount

        paid = get_total_paid_principal(
            db,
            loan.id
        )

        outstanding = get_outstanding_principal(
            db,
            loan
        )

        if loan.loan_status == LoanStatus.pending:
            pending_count += 1
            pending_amount += amount

        elif loan.loan_status == LoanStatus.approved:
            approved_count += 1
            approved_not_disbursed_amount += amount

        elif loan.loan_status == LoanStatus.active:
            active_count += 1
            outstanding_principal += outstanding

        elif loan.loan_status == LoanStatus.overdue:
            overdue_count += 1
            outstanding_principal += outstanding
            overdue_outstanding += outstanding

        elif loan.loan_status == LoanStatus.rejected:
            rejected_count += 1

        elif loan.loan_status == LoanStatus.closed:
            closed_count += 1

        rows.append({
            "id": loan.id,
            "loan_code": loan.loan_code,

            "customer_id":
                loan.customer_id,

            "customer_name":
                (
                    customer.full_name
                    if customer
                    else None
                ),

            "customer_code":
                (
                    customer.customer_code
                    if customer
                    else None
                ),

            "national_id":
                (
                    customer.national_id
                    if customer
                    else None
                ),

            "monthly_income":
                (
                    customer.monthly_income
                    if customer
                    else 0
                ),

            "bad_debt":
                (
                    customer.bad_debt
                    if customer
                    else False
                ),

            "disbursement_account_id":
                loan.disbursement_account_id,

            "disbursement_account_number":
                (
                    account.account_number
                    if account
                    else None
                ),

            "loan_amount":
                loan.loan_amount,

            "paid_principal":
                paid,

            "outstanding_principal":
                outstanding,

            "interest_rate":
                loan.interest_rate,

            "loan_term":
                loan.loan_term,

            "purpose":
                loan.purpose,

            "start_date":
                loan.start_date,

            "end_date":
                loan.end_date,

            "loan_status":
                loan.loan_status.value,

            "created_at":
                loan.created_at,
        })

    return {
        "summary": {
            "total_loans": len(loans),

            "total_requested_amount":
                total_requested_amount,

            "pending_count":
                pending_count,

            "pending_amount":
                pending_amount,

            "approved_count":
                approved_count,

            "approved_not_disbursed_amount":
                approved_not_disbursed_amount,

            "active_count":
                active_count,

            "outstanding_principal":
                outstanding_principal,

            "overdue_count":
                overdue_count,

            "overdue_outstanding":
                overdue_outstanding,

            "rejected_count":
                rejected_count,

            "closed_count":
                closed_count,
        },

        "loans": rows,
    }


# ============================================================
# LIST
# ============================================================

@router.get("/", response_model=List[LoanOut])
def get_loans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Loan)

    if current_user.role != UserRole.admin:
        query = (
            query
            .join(Customer)
            .filter(
                Customer.user_id
                == current_user.id
            )
        )

    return (
        query
        .order_by(
            Loan.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# ADMIN UPDATE STATUS
# ============================================================

@router.put("/{loan_id}", response_model=LoanOut)
def update_loan(loan_id: int, loan_in: LoanUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    update_data = loan_in.model_dump(
        exclude_unset=True
    )

    requested_status = update_data.get(
        "loan_status"
    )

    if requested_status is not None:
        allowed_transitions = {
            LoanStatus.pending: [
                LoanStatus.approved,
                LoanStatus.rejected,
            ],

            LoanStatus.approved: [
                LoanStatus.active,
                LoanStatus.rejected,
            ],

            LoanStatus.active: [
                LoanStatus.overdue,
            ],

            LoanStatus.overdue: [
                LoanStatus.active,
            ],

            LoanStatus.rejected: [],

            LoanStatus.closed: [],
        }

        allowed = allowed_transitions.get(
            loan.loan_status,
            []
        )

        if requested_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot change loan status "
                    f"from {loan.loan_status.value} "
                    f"to {requested_status.value}"
                )
            )

        # ====================================================
        # GIẢI NGÂN
        # approved -> active
        #
        # Đây là CHỖ DUY NHẤT cộng tiền vay vào balance.
        # ====================================================

        if (
            loan.loan_status == LoanStatus.approved
            and requested_status == LoanStatus.active
        ):
            if not loan.disbursement_account_id:
                raise HTTPException(
                    status_code=400,
                    detail="Loan has no disbursement account"
                )

            account = (
                db.query(Account)
                .filter(
                    Account.id
                    == loan.disbursement_account_id
                )
                .with_for_update()
                .first()
            )

            if not account:
                raise HTTPException(
                    status_code=404,
                    detail="Disbursement account not found"
                )

            if account.customer_id != loan.customer_id:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid disbursement account"
                )

            if account.status != AccountStatus.active:
                raise HTTPException(
                    status_code=400,
                    detail="Disbursement account is not active"
                )

            amount = Decimal(
                str(loan.loan_amount)
            )

            # CỘNG TIỀN ĐÚNG 1 LẦN
            account.balance = (
                Decimal(str(account.balance))
                + amount
            )

            account.available_balance = (
                Decimal(
                    str(
                        account.available_balance
                    )
                )
                + amount
            )

            today = date.today()

            loan.start_date = today

            loan.end_date = add_months(
                today,
                loan.loan_term
            )

    for field, value in update_data.items():
        setattr(
            loan,
            field,
            value
        )

    try:
        db.commit()

        db.refresh(loan)

        return loan

    except Exception:
        db.rollback()
        raise


# ============================================================
# REPAY
#
# Trừ tiền trực tiếp từ account.
# Dư nợ giảm thông qua LoanPayment.
# ============================================================

@router.post("/{loan_id}/repay")
def repay_loan(loan_id: int, repayment: LoanRepaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    check_loan_permission(
        db,
        loan,
        current_user
    )

    if loan.loan_status not in [
        LoanStatus.active,
        LoanStatus.overdue,
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only active or overdue loans can be repaid"
        )

    account = (
        db.query(Account)
        .filter(
            Account.id == repayment.account_id
        )
        .with_for_update()
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Payment account not found"
        )

    if account.customer_id != loan.customer_id:
        raise HTTPException(
            status_code=403,
            detail="Payment account does not belong to loan customer"
        )

    if account.status != AccountStatus.active:
        raise HTTPException(
            status_code=400,
            detail="Payment account is not active"
        )

    if account.currency != "VND":
        raise HTTPException(
            status_code=400,
            detail="Loan repayment currently supports VND accounts only"
        )

    payment_amount = Decimal(
        str(repayment.amount)
    )

    outstanding = get_outstanding_principal(
        db,
        loan
    )

    if payment_amount > outstanding:
        raise HTTPException(
            status_code=400,
            detail="Repayment amount exceeds outstanding principal"
        )

    available_balance = Decimal(
        str(account.available_balance)
    )

    if available_balance < payment_amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient account balance"
        )

    # ========================================================
    # TRỪ TIỀN TÀI KHOẢN
    # ========================================================

    account.balance = (
        Decimal(str(account.balance))
        - payment_amount
    )

    account.available_balance = (
        Decimal(
            str(
                account.available_balance
            )
        )
        - payment_amount
    )

    today = date.today()

    payment = LoanPayment(
        loan_id=loan.id,
        due_date=today,
        payment_date=today,
        amount_due=payment_amount,
        amount_paid=payment_amount,
        days_late=0,
        payment_status=PaymentStatus.paid,
    )

    try:
        db.add(payment)

        db.flush()

        remaining = (
            outstanding
            - payment_amount
        )

        if remaining <= 0:
            loan.loan_status = (
                LoanStatus.closed
            )

        db.commit()

        return {
            "message":
                "Repayment successful",

            "loan_id":
                loan.id,

            "loan_code":
                loan.loan_code,

            "account_id":
                account.id,

            "payment_amount":
                payment_amount,

            "outstanding_principal":
                max(
                    remaining,
                    Decimal("0")
                ),

            "account_balance":
                account.balance,

            "available_balance":
                account.available_balance,

            "loan_status":
                loan.loan_status.value,
        }

    except Exception:
        db.rollback()
        raise


# ============================================================
# DETAIL
# Phải đặt cuối vì /{loan_id}
# ============================================================

@router.get("/{loan_id}")
def get_loan(loan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    check_loan_permission(
        db,
        loan,
        current_user
    )

    return {
        "id": loan.id,

        "loan_code":
            loan.loan_code,

        "customer_id":
            loan.customer_id,

        "disbursement_account_id":
            loan.disbursement_account_id,

        "loan_amount":
            loan.loan_amount,

        "paid_principal":
            get_total_paid_principal(
                db,
                loan.id
            ),

        "outstanding_principal":
            get_outstanding_principal(
                db,
                loan
            ),

        "interest_rate":
            loan.interest_rate,

        "loan_term":
            loan.loan_term,

        "purpose":
            loan.purpose,

        "start_date":
            loan.start_date,

        "end_date":
            loan.end_date,

        "loan_status":
            loan.loan_status.value,

        "created_at":
            loan.created_at,
    }