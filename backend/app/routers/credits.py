from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import CreditProfile, Customer, User
from app.schemas import CreditProfileCreate, CreditProfileUpdate, CreditProfileOut
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/credits", tags=["Credit Profiles"])

@router.post("/", response_model=CreditProfileOut, status_code=status.HTTP_201_CREATED)
def create_credit_profile(
    credit_in: CreditProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == credit_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Kiểm tra đã có profile chưa
    existing = db.query(CreditProfile).filter(CreditProfile.customer_id == credit_in.customer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Credit profile already exists")

    if current_user.role != "admin" and customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_credit = CreditProfile(
        customer_id=credit_in.customer_id,
        credit_score=credit_in.credit_score,
        debt_ratio=credit_in.debt_ratio,
        total_debt=credit_in.total_debt,
        credit_history_length=credit_in.credit_history_length,
        previous_default=credit_in.previous_default,
        late_payment_count=credit_in.late_payment_count,
        total_loans=credit_in.total_loans
    )
    db.add(db_credit)
    db.commit()
    db.refresh(db_credit)
    return db_credit

@router.get("/{customer_id}", response_model=CreditProfileOut)
def get_credit_profile(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    credit = db.query(CreditProfile).filter(CreditProfile.customer_id == customer_id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Credit profile not found")

    if current_user.role != "admin":
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer or customer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    return credit

@router.put("/{customer_id}", response_model=CreditProfileOut)
def update_credit_profile(
    customer_id: int,
    credit_in: CreditProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    credit = db.query(CreditProfile).filter(CreditProfile.customer_id == customer_id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Credit profile not found")

    if current_user.role != "admin":
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer or customer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = credit_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(credit, field, value)

    db.commit()
    db.refresh(credit)
    return credit