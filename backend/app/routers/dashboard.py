from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from decimal import Decimal
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, UserRole, Customer, Account, Transaction, Loan, CreditProfile

router=APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/me")
def dashboard_me(db:Session=Depends(get_db), current_user:User=Depends(get_current_user)):
    if current_user.role == UserRole.admin:
        return {"mode":"admin","customers_count":db.query(Customer).count(),"accounts_count":db.query(Account).count(),"transactions_count":db.query(Transaction).count(),"loans_count":db.query(Loan).count(),"total_balance":db.query(func.coalesce(func.sum(Account.balance),0)).scalar()}
    customer=db.query(Customer).filter(Customer.user_id==current_user.id).first()
    if not customer:
        return {"mode":"user","profile_complete":False,"customer":None,"accounts":[],"recent_transactions":[],"loans":[],"credit_profile":None,"total_balance":Decimal("0")}
    accounts=db.query(Account).filter(Account.customer_id==customer.id).all()
    ids=[a.id for a in accounts]
    tx=[]
    if ids:
        tx=db.query(Transaction).filter(or_(Transaction.from_account_id.in_(ids),Transaction.to_account_id.in_(ids))).order_by(Transaction.created_at.desc()).limit(8).all()
    loans=db.query(Loan).filter(Loan.customer_id==customer.id).order_by(Loan.created_at.desc()).limit(5).all()
    credit=db.query(CreditProfile).filter(CreditProfile.customer_id==customer.id).first()
    return {
      "mode":"user","profile_complete":True,
      "customer":{"id":customer.id,"customer_code":customer.customer_code,"full_name":customer.full_name,"phone":customer.phone,"email":customer.email},
      "total_balance":sum((a.balance or Decimal("0")) for a in accounts),
      "accounts":[{"id":a.id,"account_number":a.account_number,"account_type":a.account_type.value,"currency":a.currency,"balance":a.balance,"available_balance":a.available_balance,"status":a.status.value} for a in accounts],
      "recent_transactions":[{"id":t.id,"transaction_code":t.transaction_code,"from_account_id":t.from_account_id,"to_account_id":t.to_account_id,"amount":t.amount,"currency":t.currency,"transaction_type":t.transaction_type.value,"status":t.status.value,"description":t.description,"created_at":t.created_at} for t in tx],
      "loans":[{"id":l.id,"loan_code":l.loan_code,"loan_amount":l.loan_amount,"loan_status":l.loan_status.value,"purpose":l.purpose} for l in loans],
      "credit_profile": None if not credit else {"credit_score":credit.credit_score,"debt_ratio":credit.debt_ratio,"total_debt":credit.total_debt,"late_payment_count":credit.late_payment_count}
    }
