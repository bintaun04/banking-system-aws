from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, Date, Enum, 
    DECIMAL, Text, TIMESTAMP, ForeignKey, CHAR
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# ====================== ENUMS ======================
class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class AccountType(str, enum.Enum):
    checking = "checking"
    saving = "saving"

class AccountStatus(str, enum.Enum):
    active = "active"
    locked = "locked"
    closed = "closed"

class TransactionType(str, enum.Enum):
    deposit = "deposit"
    withdraw = "withdraw"
    transfer = "transfer"

class TransactionStatus(str, enum.Enum):
    success = "success"
    failed = "failed"
    pending = "pending"

class LoanStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    active = "active"
    overdue = "overdue"
    closed = "closed"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    late = "late"
    overdue = "overdue"

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

# ====================== MODELS ======================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="user", uselist=False)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    customer_code = Column(String(20), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=True)
    phone = Column(String(20), unique=True, nullable=True)
    email = Column(String(100), nullable=True)
    permanent_address = Column(String(255), nullable=True)
    national_id = Column(String(20), unique=True, nullable=False)
    occupation = Column(String(100), nullable=True)
    monthly_income = Column(DECIMAL(15, 2), default=0)
    bad_debt = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="customer")
    accounts = relationship("Account", back_populates="customer")
    loans = relationship("Loan", back_populates="customer")
    credit_profile = relationship("CreditProfile", back_populates="customer", uselist=False)
    predictions = relationship("Prediction", back_populates="customer")

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    branch_code = Column(String(20), unique=True, nullable=False)
    branch_name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    accounts = relationship("Account", back_populates="branch")

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    account_number = Column(String(20), unique=True, nullable=False, index=True)
    account_type = Column(Enum(AccountType), default=AccountType.checking, nullable=False)
    currency = Column(CHAR(3), default="VND", nullable=False)
    balance = Column(DECIMAL(19, 2), default=0, nullable=False)
    available_balance = Column(DECIMAL(19, 2), default=0, nullable=False)
    transaction_limit = Column(DECIMAL(19, 2), default=0)
    interest_rate = Column(DECIMAL(5, 2), default=0)
    opened_at = Column(Date, nullable=False)
    status = Column(Enum(AccountStatus), default=AccountStatus.active, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="accounts")
    branch = relationship("Branch", back_populates="accounts")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, index=True)
    transaction_code = Column(String(30), unique=True, nullable=False)
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    amount = Column(DECIMAL(19, 2), nullable=False)
    currency = Column(CHAR(3), default="VND", nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    loan_code = Column(String(30), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    loan_amount = Column(DECIMAL(19, 2), nullable=False)
    interest_rate = Column(DECIMAL(5, 2), nullable=False)
    loan_term = Column(Integer, nullable=False)
    purpose = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    loan_status = Column(Enum(LoanStatus), default=LoanStatus.pending, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="loans")
    payments = relationship("LoanPayment", back_populates="loan")

class LoanPayment(Base):
    __tablename__ = "loan_payments"

    id = Column(BigInteger, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    amount_due = Column(DECIMAL(19, 2), nullable=False)
    amount_paid = Column(DECIMAL(19, 2), default=0)
    days_late = Column(Integer, default=0, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    loan = relationship("Loan", back_populates="payments")

class CreditProfile(Base):
    __tablename__ = "credit_profiles"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)
    credit_score = Column(Integer, nullable=True)
    debt_ratio = Column(DECIMAL(7, 4), nullable=True)
    total_debt = Column(DECIMAL(19, 2), default=0)
    credit_history_length = Column(Integer, nullable=True)
    previous_default = Column(Boolean, default=False, nullable=False)
    late_payment_count = Column(Integer, default=0, nullable=False)
    total_loans = Column(Integer, default=0, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="credit_profile")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(BigInteger, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    model_name = Column(String(50), nullable=False)
    model_version = Column(String(30), nullable=True)
    risk_probability = Column(DECIMAL(6, 5), nullable=True)
    risk_level = Column(Enum(RiskLevel), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    customer = relationship("Customer", back_populates="predictions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=True)
    resource_id = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())