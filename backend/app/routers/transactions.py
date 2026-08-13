from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
import uuid

from app.database import get_db
from app.models import (
    Account,
    Transaction,
    Customer,
    User,
    AccountStatus,
    TransactionType,
    TransactionStatus,
)
from app.schemas import (
    DepositWithdraw,
    Transfer,
    TransactionOut,
)
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


# ============================================================
# HELPER
# ============================================================

def generate_transaction_code():
    return "TXN" + uuid.uuid4().hex[:20].upper()


def check_account_owner(
    account: Account,
    current_user: User,
    db: Session
):
    """
    Kiểm tra user có quyền thao tác với tài khoản hay không.
    Admin được phép thao tác tất cả.
    User chỉ được thao tác tài khoản của chính mình.
    """

    customer = db.query(Customer).filter(
        Customer.id == account.customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if current_user.role.value != "admin":
        if customer.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions"
            )


def check_transaction_limit(
    account: Account,
    amount: Decimal
):
    """
    transaction_limit = 0 nghĩa là không giới hạn.
    """

    if (
        account.transaction_limit
        and account.transaction_limit > 0
        and amount > account.transaction_limit
    ):
        raise HTTPException(
            status_code=400,
            detail="Transaction amount exceeds account limit"
        )


# ============================================================
# DEPOSIT
# ============================================================

@router.post(
    "/deposit",
    response_model=TransactionOut
)
def deposit(
    data: DepositWithdraw,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # --------------------------------------------------------
    # 1. Tìm tài khoản
    # --------------------------------------------------------

    account = db.query(Account).filter(
        Account.id == data.account_id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    # --------------------------------------------------------
    # 2. Kiểm tra trạng thái
    # --------------------------------------------------------

    if account.status != AccountStatus.active:
        raise HTTPException(
            status_code=400,
            detail="Account is not active"
        )

    # --------------------------------------------------------
    # 3. Kiểm tra quyền
    # --------------------------------------------------------

    check_account_owner(
        account,
        current_user,
        db
    )

    # --------------------------------------------------------
    # 4. Kiểm tra hạn mức
    # --------------------------------------------------------

    check_transaction_limit(
        account,
        data.amount
    )

    # --------------------------------------------------------
    # 5. Thực hiện deposit
    # --------------------------------------------------------

    try:

        account.balance += data.amount
        account.available_balance += data.amount

        transaction = Transaction(
            transaction_code=generate_transaction_code(),
            to_account_id=account.id,
            amount=data.amount,
            currency=account.currency,
            transaction_type=TransactionType.deposit,
            status=TransactionStatus.success,
            description=data.description or "Deposit"
        )

        db.add(transaction)

        db.commit()
        db.refresh(transaction)

        return transaction

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Deposit failed"
        )


# ============================================================
# WITHDRAW
# ============================================================

@router.post(
    "/withdraw",
    response_model=TransactionOut
)
def withdraw(
    data: DepositWithdraw,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # --------------------------------------------------------
    # 1. Tìm tài khoản
    # --------------------------------------------------------

    account = db.query(Account).filter(
        Account.id == data.account_id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    # --------------------------------------------------------
    # 2. Kiểm tra trạng thái
    # --------------------------------------------------------

    if account.status != AccountStatus.active:
        raise HTTPException(
            status_code=400,
            detail="Account is not active"
        )

    # --------------------------------------------------------
    # 3. Kiểm tra quyền
    # --------------------------------------------------------

    check_account_owner(
        account,
        current_user,
        db
    )

    # --------------------------------------------------------
    # 4. Kiểm tra hạn mức
    # --------------------------------------------------------

    check_transaction_limit(
        account,
        data.amount
    )

    # --------------------------------------------------------
    # 5. Kiểm tra số dư khả dụng
    # --------------------------------------------------------

    if account.available_balance < data.amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient available balance"
        )

    # --------------------------------------------------------
    # 6. Thực hiện withdraw
    # --------------------------------------------------------

    try:

        account.balance -= data.amount
        account.available_balance -= data.amount

        transaction = Transaction(
            transaction_code=generate_transaction_code(),
            from_account_id=account.id,
            amount=data.amount,
            currency=account.currency,
            transaction_type=TransactionType.withdraw,
            status=TransactionStatus.success,
            description=data.description or "Withdraw"
        )

        db.add(transaction)

        db.commit()
        db.refresh(transaction)

        return transaction

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Withdraw failed"
        )


# ============================================================
# TRANSFER
# ============================================================

@router.post(
    "/transfer",
    response_model=TransactionOut
)
def transfer(
    data: Transfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # --------------------------------------------------------
    # 1. Tìm tài khoản gửi
    # --------------------------------------------------------

    from_acc = db.query(Account).filter(
        Account.id == data.from_account_id
    ).first()

    if not from_acc:
        raise HTTPException(
            status_code=404,
            detail="Source account not found"
        )

    # --------------------------------------------------------
    # 2. Tìm tài khoản nhận
    # --------------------------------------------------------

    to_acc = db.query(Account).filter(
        Account.id == data.to_account_id
    ).first()

    if not to_acc:
        raise HTTPException(
            status_code=404,
            detail="Destination account not found"
        )

    # --------------------------------------------------------
    # 3. Không cho chuyển cho chính mình
    # --------------------------------------------------------

    if from_acc.id == to_acc.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot transfer to the same account"
        )

    # --------------------------------------------------------
    # 4. Kiểm tra trạng thái
    # --------------------------------------------------------

    if from_acc.status != AccountStatus.active:
        raise HTTPException(
            status_code=400,
            detail="Source account is not active"
        )

    if to_acc.status != AccountStatus.active:
        raise HTTPException(
            status_code=400,
            detail="Destination account is not active"
        )

    # --------------------------------------------------------
    # 5. Kiểm tra currency
    # --------------------------------------------------------

    if from_acc.currency != to_acc.currency:
        raise HTTPException(
            status_code=400,
            detail="Currency mismatch"
        )

    # --------------------------------------------------------
    # 6. Kiểm tra quyền tài khoản gửi
    # --------------------------------------------------------

    check_account_owner(
        from_acc,
        current_user,
        db
    )

    # --------------------------------------------------------
    # 7. Kiểm tra hạn mức
    # --------------------------------------------------------

    check_transaction_limit(
        from_acc,
        data.amount
    )

    # --------------------------------------------------------
    # 8. Kiểm tra số dư khả dụng
    # --------------------------------------------------------

    if from_acc.available_balance < data.amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient available balance"
        )

    # --------------------------------------------------------
    # 9. Thực hiện transfer
    # --------------------------------------------------------

    try:

        # Tài khoản gửi
        from_acc.balance -= data.amount
        from_acc.available_balance -= data.amount

        # Tài khoản nhận
        to_acc.balance += data.amount
        to_acc.available_balance += data.amount

        # Tạo transaction
        transaction = Transaction(
            transaction_code=generate_transaction_code(),
            from_account_id=from_acc.id,
            to_account_id=to_acc.id,
            amount=data.amount,
            currency=from_acc.currency,
            transaction_type=TransactionType.transfer,
            status=TransactionStatus.success,
            description=data.description or "Transfer"
        )

        db.add(transaction)

        db.commit()
        db.refresh(transaction)

        return transaction

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Transfer failed"
        )


# ============================================================
# GET TRANSACTIONS
# ============================================================

@router.get(
    "/",
    response_model=List[TransactionOut]
)
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------------
    # ADMIN
    # --------------------------------------------------------

    if current_user.role.value == "admin":

        transactions = (
            db.query(Transaction)
            .order_by(Transaction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return transactions

    # --------------------------------------------------------
    # USER
    # --------------------------------------------------------

    account_ids = (
        db.query(Account.id)
        .join(Customer)
        .filter(
            Customer.user_id == current_user.id
        )
        .all()
    )

    account_ids = [
        account_id[0]
        for account_id in account_ids
    ]

    transactions = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id.in_(account_ids))
            |
            (Transaction.to_account_id.in_(account_ids))
        )
        .order_by(
            Transaction.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return transactions