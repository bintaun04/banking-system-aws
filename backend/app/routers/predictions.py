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
    Prediction,
    Customer,
    User,
    UserRole,
)

from app.schemas import (
    PredictionCreate,
    PredictionOut,
)

from app.dependencies import (
    get_current_user,
    get_current_admin,
)

from app.audit import create_audit_log


router = APIRouter(
    prefix="/predictions",
    tags=["Predictions"],
)


# ============================================================
# CREATE
# ADMIN / MODEL SERVICE
# ============================================================

@router.post(
    "/",
    response_model=PredictionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_prediction(
    pred_in: PredictionCreate,

    db: Session = Depends(get_db),

    current_admin: User = Depends(
        get_current_admin
    ),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id
            == pred_in.customer_id
        )
        .first()
    )


    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )


    prediction = Prediction(
        customer_id=
            pred_in.customer_id,

        model_name=
            pred_in.model_name,

        model_version=
            pred_in.model_version,

        risk_probability=
            pred_in.risk_probability,

        risk_level=
            pred_in.risk_level,
    )


    try:
        db.add(prediction)

        db.flush()


        create_audit_log(
            db=db,

            user_id=
                current_admin.id,

            action=
                "CREATE_PREDICTION",

            resource=
                "predictions",

            resource_id=
                prediction.id,

            description=(
                f"Prediction for "
                f"customer "
                f"{prediction.customer_id}"
            ),
        )


        db.commit()

        db.refresh(prediction)

        return prediction

    except Exception:
        db.rollback()
        raise


# ============================================================
# GET BY CUSTOMER
# ============================================================

@router.get(
    "/customer/{customer_id}",
    response_model=List[PredictionOut],
)
def get_predictions_by_customer(
    customer_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id
            == customer_id
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


    return (
        db.query(Prediction)
        .filter(
            Prediction.customer_id
            == customer_id
        )
        .order_by(
            Prediction.created_at.desc()
        )
        .all()
    )