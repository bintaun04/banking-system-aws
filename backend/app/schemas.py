from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

from app.models import (
    UserRole,
    Gender,
    AccountType,
    AccountStatus,
    TransactionType,
    TransactionStatus,
    LoanStatus,
    PaymentStatus,
    RiskLevel,
)


# ============================================================
# AUTH / USER
# ============================================================

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.user


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# PUBLIC REGISTER
# Đăng ký công khai tạo đồng thời User + Customer
# Không cho client gửi role hoặc bad_debt.
# ============================================================

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

    full_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: Optional[Gender] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    permanent_address: Optional[str] = Field(default=None, max_length=255)
    national_id: str = Field(..., min_length=9, max_length=20)
    occupation: Optional[str] = Field(default=None, max_length=100)
    monthly_income: Decimal = Field(default=Decimal("0"), ge=0)


# ============================================================
# CUSTOMER
# ============================================================

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)

    date_of_birth: date

    gender: Optional[Gender] = None

    phone: Optional[str] = Field(
        default=None,
        max_length=20
    )

    email: Optional[EmailStr] = None

    permanent_address: Optional[str] = Field(
        default=None,
        max_length=255
    )

    national_id: str = Field(
        ...,
        min_length=9,
        max_length=20
    )

    occupation: Optional[str] = Field(
        default=None,
        max_length=100
    )

    monthly_income: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )


class CustomerCreate(CustomerBase):
    user_id: Optional[int] = None

    bad_debt: bool = False


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    date_of_birth: Optional[date] = None

    gender: Optional[Gender] = None

    phone: Optional[str] = Field(
        default=None,
        max_length=20
    )

    email: Optional[EmailStr] = None

    permanent_address: Optional[str] = Field(
        default=None,
        max_length=255
    )

    national_id: Optional[str] = Field(
        default=None,
        min_length=9,
        max_length=20
    )

    occupation: Optional[str] = Field(
        default=None,
        max_length=100
    )

    monthly_income: Optional[Decimal] = Field(
        default=None,
        ge=0
    )

    bad_debt: Optional[bool] = None


class CustomerOut(CustomerBase):
    id: int
    user_id: Optional[int] = None
    customer_code: str
    bad_debt: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# BRANCH
# ============================================================

class BranchCreate(BaseModel):
    branch_code: str = Field(..., min_length=2, max_length=20)
    branch_name: str = Field(..., min_length=2, max_length=100)
    address: Optional[str] = Field(
        default=None,
        max_length=255
    )
    phone: Optional[str] = Field(
        default=None,
        max_length=20
    )


class BranchUpdate(BaseModel):
    branch_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    address: Optional[str] = Field(
        default=None,
        max_length=255
    )

    phone: Optional[str] = Field(
        default=None,
        max_length=20
    )


class BranchOut(BaseModel):
    id: int
    branch_code: str
    branch_name: str
    address: Optional[str]
    phone: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ACCOUNT
# ============================================================

class AccountCreate(BaseModel):
    customer_id: int

    branch_id: Optional[int] = None

    account_type: AccountType = AccountType.checking

    currency: str = Field(
        default="VND",
        min_length=3,
        max_length=3
    )

    transaction_limit: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    interest_rate: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )


class AccountUpdate(BaseModel):
    account_type: Optional[AccountType] = None

    branch_id: Optional[int] = None

    transaction_limit: Optional[Decimal] = Field(
        default=None,
        ge=0
    )

    interest_rate: Optional[Decimal] = Field(
        default=None,
        ge=0
    )

    status: Optional[AccountStatus] = None


class AccountOut(BaseModel):
    id: int
    customer_id: int
    branch_id: Optional[int]

    account_number: str

    account_type: AccountType

    currency: str

    balance: Decimal

    available_balance: Decimal

    transaction_limit: Decimal

    interest_rate: Decimal

    opened_at: date

    status: AccountStatus

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# TRANSACTION
# ============================================================

class DepositWithdraw(BaseModel):
    account_id: int

    amount: Decimal = Field(
        ...,
        gt=0
    )

    description: Optional[str] = Field(
        default=None,
        max_length=255
    )


class Transfer(BaseModel):
    from_account_id: int

    to_account_id: int

    amount: Decimal = Field(
        ...,
        gt=0
    )

    description: Optional[str] = Field(
        default=None,
        max_length=255
    )


class TransactionOut(BaseModel):
    id: int

    transaction_code: str

    from_account_id: Optional[int]

    to_account_id: Optional[int]

    amount: Decimal

    currency: str

    transaction_type: TransactionType

    status: TransactionStatus

    description: Optional[str]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# LOAN
# ============================================================

class LoanCreate(BaseModel):
    customer_id: int
    disbursement_account_id: int
    loan_amount: Decimal = Field(..., gt=0)
    interest_rate: Decimal = Field(..., ge=0)
    loan_term: int = Field(..., gt=0)
    purpose: Optional[str] = None


class LoanUpdate(BaseModel):
    loan_status: Optional[LoanStatus] = None
    interest_rate: Optional[Decimal] = Field(None, ge=0)
    loan_term: Optional[int] = Field(None, gt=0)
    purpose: Optional[str] = None


class LoanOut(BaseModel):
    id: int
    loan_code: str
    customer_id: int
    disbursement_account_id: Optional[int] = None
    loan_amount: Decimal
    interest_rate: Decimal
    loan_term: int
    purpose: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    loan_status: LoanStatus
    created_at: datetime

    class Config:
        from_attributes = True


class LoanRepaymentCreate(BaseModel):
    account_id: int
    amount: Decimal = Field(..., gt=0)

# ============================================================
# LOAN PAYMENT
# ============================================================

class LoanPaymentCreate(BaseModel):
    loan_id: int

    due_date: date

    payment_date: Optional[date] = None

    amount_due: Decimal = Field(
        ...,
        gt=0
    )

    amount_paid: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    days_late: int = Field(
        default=0,
        ge=0
    )

    payment_status: PaymentStatus = PaymentStatus.pending


class LoanPaymentUpdate(BaseModel):
    payment_date: Optional[date] = None

    amount_paid: Optional[Decimal] = Field(
        default=None,
        ge=0
    )

    days_late: Optional[int] = Field(
        default=None,
        ge=0
    )

    payment_status: Optional[PaymentStatus] = None


class LoanPaymentOut(BaseModel):
    id: int

    loan_id: int

    due_date: date

    payment_date: Optional[date]

    amount_due: Decimal

    amount_paid: Decimal

    days_late: int

    payment_status: PaymentStatus

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# CREDIT PROFILE
# ============================================================

class CreditProfileCreate(BaseModel):
    customer_id: int

    credit_score: Optional[int] = Field(
        default=None,
        ge=0,
        le=1000
    )

    debt_ratio: Optional[Decimal] = Field(
        default=None,
        ge=0
    )

    total_debt: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    credit_history_length: Optional[int] = Field(
        default=None,
        ge=0
    )

    previous_default: bool = False

    late_payment_count: int = Field(
        default=0,
        ge=0
    )

    total_loans: int = Field(
        default=0,
        ge=0
    )


class CreditProfileUpdate(BaseModel):
    credit_score: Optional[int] = Field(
        default=None,
        ge=0,
        le=1000
    )

    debt_ratio: Optional[Decimal] = Field(
        default=None,
        ge=0
    )

    total_debt: Optional[Decimal] = Field(
        default=None,
        ge=0
    )

    credit_history_length: Optional[int] = Field(
        default=None,
        ge=0
    )

    previous_default: Optional[bool] = None

    late_payment_count: Optional[int] = Field(
        default=None,
        ge=0
    )

    total_loans: Optional[int] = Field(
        default=None,
        ge=0
    )


class CreditProfileOut(BaseModel):
    id: int

    customer_id: int

    credit_score: Optional[int]

    debt_ratio: Optional[Decimal]

    total_debt: Decimal

    credit_history_length: Optional[int]

    previous_default: bool

    late_payment_count: int

    total_loans: int

    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# PREDICTION
# ============================================================

class PredictionCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    customer_id: int

    model_name: str = Field(
        default="placeholder",
        max_length=50
    )

    model_version: Optional[str] = Field(
        default=None,
        max_length=30
    )

    risk_probability: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=1
    )

    risk_level: Optional[RiskLevel] = None


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    id: int

    customer_id: int

    model_name: str

    model_version: Optional[str]

    risk_probability: Optional[Decimal]

    risk_level: Optional[RiskLevel]

    created_at: datetime


# ============================================================
# AUDIT LOG
# ============================================================

class AuditLogOut(BaseModel):
    id: int

    user_id: Optional[int]

    action: str

    resource: Optional[str]

    resource_id: Optional[str]

    ip_address: Optional[str]

    description: Optional[str]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ============================================================
# ADMIN CREATE
# ============================================================

class AdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)