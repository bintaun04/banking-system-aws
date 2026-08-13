from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string

from app.database import get_db
from app.models import Customer, User, UserRole
from app.schemas import CustomerCreate, CustomerUpdate, CustomerOut
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/customers", tags=["Customers"])


def generate_customer_code(db: Session) -> str:
    while True:
        code = "CUS" + "".join(random.choices(string.digits, k=8))
        exists = (
            db.query(Customer)
            .filter(Customer.customer_code == code)
            .first()
        )
        if not exists:
            return code


@router.post(
    "/",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = (
        customer_in.user_id
        if current_user.role == UserRole.admin
        else current_user.id
    )

    if user_id and (
        db.query(Customer)
        .filter(Customer.user_id == user_id)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="This user already has a customer profile",
        )

    if (
        db.query(Customer)
        .filter(Customer.national_id == customer_in.national_id)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="National ID already exists",
        )

    if customer_in.phone and (
        db.query(Customer)
        .filter(Customer.phone == customer_in.phone)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="Phone already exists",
        )

    data = customer_in.model_dump(exclude={"user_id", "bad_debt"})

    obj = Customer(
        user_id=user_id,
        customer_code=generate_customer_code(db),
        bad_debt=False if current_user.role != UserRole.admin else customer_in.bad_debt,
        **data,
    )

    try:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except Exception:
        db.rollback()
        raise


# /me phải đặt trước /{customer_id}
@router.get("/me", response_model=CustomerOut)
def get_my_customer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer)
        .filter(Customer.user_id == current_user.id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer profile not found",
        )

    return customer


@router.get("/", response_model=List[CustomerOut])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Customer)

    if current_user.role != UserRole.admin:
        query = query.filter(Customer.user_id == current_user.id)

    return query.offset(skip).limit(limit).all()


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if (
        current_user.role != UserRole.admin
        and customer.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )

    return customer


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if (
        current_user.role != UserRole.admin
        and customer.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )

    update_data = customer_in.model_dump(exclude_unset=True)

    # User thường không được tự sửa trạng thái nợ xấu
    if current_user.role != UserRole.admin:
        update_data.pop("bad_debt", None)

    if "national_id" in update_data:
        duplicated = (
            db.query(Customer)
            .filter(
                Customer.national_id == update_data["national_id"],
                Customer.id != customer_id,
            )
            .first()
        )
        if duplicated:
            raise HTTPException(
                status_code=400,
                detail="National ID already exists",
            )

    if update_data.get("phone"):
        duplicated = (
            db.query(Customer)
            .filter(
                Customer.phone == update_data["phone"],
                Customer.id != customer_id,
            )
            .first()
        )
        if duplicated:
            raise HTTPException(
                status_code=400,
                detail="Phone already exists",
            )

    for field, value in update_data.items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
        return customer
    except Exception:
        db.rollback()
        raise


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return None
