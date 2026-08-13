from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Prediction, Customer, User
from app.schemas import PredictionCreate, PredictionOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("/", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def create_prediction(
    pred_in: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == pred_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Placeholder: chưa có model thật
    db_pred = Prediction(
        customer_id=pred_in.customer_id,
        model_name=pred_in.model_name,
        model_version=pred_in.model_version,
        risk_probability=pred_in.risk_probability,
        risk_level=pred_in.risk_level
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred

@router.get("/customer/{customer_id}", response_model=List[PredictionOut])
def get_predictions_by_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    preds = (
        db.query(Prediction)
        .filter(Prediction.customer_id == customer_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    return preds