from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import (
    auth,
    branches,
    customers,
    accounts,
    transactions,
    loans,
    credits,
    predictions,
    dashboard,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Banking System API",
    description="Hệ thống ngân hàng mô phỏng - Đồ án tốt nghiệp",
    version="2.0.0",
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    # Cho phép tất cả port localhost trong môi trường DEV
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(loans.router)
app.include_router(credits.router)
app.include_router(predictions.router)
app.include_router(branches.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "message": "Banking System API is running",
        "docs": "/docs"
    }