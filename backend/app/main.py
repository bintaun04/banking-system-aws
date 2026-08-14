from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.database import (
    engine,
    Base,
)

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
    admin,
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="NOVA Banking System API",

    description=(
        "Hệ thống ngân hàng mô phỏng "
        "- Đồ án tốt nghiệp"
    ),

    version="2.1.0",
)


# ============================================================
# CORS
# DEV MODE
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origin_regex=(
        r"^https?://"
        r"(localhost|127\.0\.0\.1)"
        r"(:\d+)?$"
    ),

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# CUSTOMER / COMMON ROUTERS
# ============================================================

app.include_router(
    auth.router
)

app.include_router(
    customers.router
)

app.include_router(
    accounts.router
)

app.include_router(
    transactions.router
)

app.include_router(
    loans.router
)

app.include_router(
    credits.router
)

app.include_router(
    predictions.router
)

app.include_router(
    branches.router
)

app.include_router(
    dashboard.router
)


# ============================================================
# ADMIN
# ============================================================

app.include_router(
    admin.router
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "name":
            "NOVA Banking System API",

        "version":
            "2.1.0",

        "status":
            "running",

        "docs":
            "/docs",
    }


# ============================================================
# HEALTH CHECK
# Dùng sau này cho AWS / Docker
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }