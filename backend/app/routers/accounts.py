from datetime import date

import random
import string

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from typing import List

from app.database import get_db

from app.models import (
    Account,
    Customer,
    User,
    UserRole,
    AccountStatus,
)

from app.schemas import (
    AccountCreate,
    AccountUpdate,
    AccountOut,
)

from app.dependencies import (
    get_current_user,
    get_current_admin,
)

from app.audit import create_audit_log


router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"],
)


# ============================================================
# GENERATE ACCOUNT NUMBER
# ============================================================

def generate_account_number():
    return "".join(
        random.choices(
            string.digits,
            k=10,
        )
    )


def unique_account_number(
    db: Session,
):
    while True:
        number = (
            generate_account_number()
        )

        exists = (
            db.query(Account)
            .filter(
                Account.account_number
                == number
            )
            .first()
        )

        if not exists:
            return number


# ============================================================
# CREATE
# ============================================================

@router.post(
    "/",
    response_model=AccountOut,
    status_code=status.HTTP_201_CREATED,
)
def create_account(
    account_in: AccountCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id
            == account_in.customer_id
        )
        .first()
    )


    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )


    if (
        current_user.role
        != UserRole.admin
        and
        customer.user_id
        != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )


    account = Account(
        customer_id=
            account_in.customer_id,

        branch_id=
            account_in.branch_id,

        account_number=
            unique_account_number(db),

        account_type=
            account_in.account_type,

        currency=
            account_in.currency.upper(),

        balance=0,

        available_balance=0,

        transaction_limit=
            account_in.transaction_limit,

        interest_rate=
            account_in.interest_rate,

        opened_at=
            date.today(),

        status=
            AccountStatus.active,
    )


    try:
        db.add(account)

        db.flush()


        create_audit_log(
            db=db,

            user_id=current_user.id,

            action="CREATE_ACCOUNT",

            resource="accounts",

            resource_id=account.id,

            description=(
                f"Created account "
                f"{account.account_number}"
            ),
        )


        db.commit()

        db.refresh(account)

        return account

    except Exception:
        db.rollback()
        raise


# ============================================================
# LIST
# ============================================================

@router.get(
    "/",
    response_model=List[AccountOut],
)
def get_accounts(
    skip: int = 0,
    limit: int = 100,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):
    query = db.query(Account)


    if (
        current_user.role
        != UserRole.admin
    ):
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
            Account.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# DETAIL
# ============================================================

@router.get(
    "/{account_id}",
    response_model=AccountOut,
)
def get_account(
    account_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):
    account = (
        db.query(Account)
        .filter(
            Account.id
            == account_id
        )
        .first()
    )


    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )


    if (
        current_user.role
        != UserRole.admin
    ):
        customer = (
            db.query(Customer)
            .filter(
                Customer.id
                == account.customer_id
            )
            .first()
        )


        if (
            not customer
            or customer.user_id
            != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions",
            )


    return account


# ============================================================
# UPDATE - ADMIN ONLY
# ============================================================

@router.put(
    "/{account_id}",
    response_model=AccountOut,
)
def update_account(
    account_id: int,

    account_in: AccountUpdate,

    db: Session = Depends(get_db),

    current_admin: User = Depends(
        get_current_admin
    ),
):
    account = (
        db.query(Account)
        .filter(
            Account.id
            == account_id
        )
        .first()
    )


    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )


    update_data = (
        account_in.model_dump(
            exclude_unset=True
        )
    )


    for field, value in (
        update_data.items()
    ):
        setattr(
            account,
            field,
            value,
        )


    try:
        create_audit_log(
            db=db,

            user_id=
                current_admin.id,

            action=
                "UPDATE_ACCOUNT",

            resource=
                "accounts",

            resource_id=
                account.id,

            description=(
                f"Updated fields: "
                f"{list(update_data.keys())}"
            ),
        )


        db.commit()

        db.refresh(account)

        return account

    except Exception:
        db.rollback()
        raise