from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database import get_db
from app.models import Loan, Customer, User, LoanStatus
from app.schemas import LoanCreate, LoanUpdate, LoanOut
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.post("/", response_model=LoanOut, status_code=status.HTTP_201_CREATED)
def create_loan(
    loan_in: LoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == loan_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if current_user.role != "admin" and customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_loan = Loan(
        loan_code=generate_loan_code(),
        customer_id=loan_in.customer_id,
        loan_amount=loan_in.loan_amount,
        interest_rate=loan_in.interest_rate,
        loan_term=loan_in.loan_term,
        purpose=loan_in.purpose,
        start_date=loan_in.start_date,
        end_date=loan_in.end_date,
        loan_status=LoanStatus.pending
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.get("/", response_model=List[LoanOut])
def get_loans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        loans = db.query(Loan).offset(skip).limit(limit).all()
    else:
        loans = (
            db.query(Loan)
            .join(Customer)
            .filter(Customer.user_id == current_user.id)
            .all()
        )
    return loans

@router.get("/{loan_id}", response_model=LoanOut)
def get_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if current_user.role != "admin":
        customer = db.query(Customer).filter(Customer.id == loan.customer_id).first()
        if not customer or customer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    return loan

@router.put("/{loan_id}", response_model=LoanOut)
def update_loan(
    loan_id: int,
    loan_in: LoanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    update_data = loan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(loan, field, value)

    db.commit()
    db.refresh(loan)
    return loan

def generate_loan_code():
    return "LOAN" + uuid.uuid4().hex[:20].upper()