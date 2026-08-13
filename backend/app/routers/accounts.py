from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string
from datetime import date
from app.database import get_db
from app.models import Account, Customer, User, AccountStatus
from app.schemas import AccountCreate, AccountUpdate, AccountOut
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/accounts", tags=["Accounts"])

def generate_account_number():
    return "".join(random.choices(string.digits, k=10))

@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == account_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # User thường chỉ tạo được tài khoản cho chính mình
    if current_user.role != "admin" and customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    account_number = generate_account_number()
    while db.query(Account).filter(Account.account_number == account_number).first():
        account_number = generate_account_number()

    db_account = Account(
        customer_id=account_in.customer_id,
        branch_id=account_in.branch_id,
        account_number=account_number,
        account_type=account_in.account_type,
        currency=account_in.currency.upper(),
        balance=0,
        available_balance=0,
        transaction_limit=account_in.transaction_limit,
        interest_rate=account_in.interest_rate,
        opened_at=date.today(),
        status=AccountStatus.active
)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/", response_model=List[AccountOut])
def get_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        accounts = db.query(Account).offset(skip).limit(limit).all()
    else:
        accounts = (
            db.query(Account)
            .join(Customer)
            .filter(Customer.user_id == current_user.id)
            .all()
        )
    return accounts

@router.get("/{account_id}", response_model=AccountOut)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if current_user.role != "admin":
        customer = db.query(Customer).filter(Customer.id == account.customer_id).first()
        if not customer or customer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    return account

@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    account_in: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account