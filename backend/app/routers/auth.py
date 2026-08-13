from datetime import timedelta
import random
import string

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db, settings
from app.models import User, Customer, UserRole
from app.schemas import RegisterRequest, UserOut, Token
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


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
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    if (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="Username already registered",
        )

    if (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    if (
        db.query(Customer)
        .filter(Customer.national_id == data.national_id)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="National ID already registered",
        )

    if data.phone and (
        db.query(Customer)
        .filter(Customer.phone == data.phone)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="Phone already registered",
        )

    try:
        user = User(
            username=data.username,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            role=UserRole.user,
            is_active=True,
        )

        db.add(user)
        db.flush()

        customer = Customer(
            user_id=user.id,
            customer_code=generate_customer_code(db),
            full_name=data.full_name,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            phone=data.phone,
            email=data.email,
            permanent_address=data.permanent_address,
            national_id=data.national_id,
            occupation=data.occupation,
            monthly_income=data.monthly_income,
            bad_debt=False,
        )

        db.add(customer)
        db.commit()
        db.refresh(user)

        return user

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.username == form_data.username)
        .first()
    )

    if (
        not user
        or not verify_password(
            form_data.password,
            user.hashed_password,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        {
            "sub": user.username,
            "role": user.role.value,
        },
        timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserOut)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user
