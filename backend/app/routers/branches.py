from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Branch
from app.schemas import BranchCreate, BranchUpdate, BranchOut
from app.dependencies import get_current_user, get_current_admin
from app.models import User


router = APIRouter(
    prefix="/branches",
    tags=["Branches"]
)


# ============================================================
# GET ALL BRANCHES
# ============================================================

@router.get("/", response_model=list[BranchOut])
def get_branches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Branch).all()


# ============================================================
# GET BRANCH BY ID
# ============================================================

@router.get("/{branch_id}", response_model=BranchOut)
def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    branch = db.query(Branch).filter(
        Branch.id == branch_id
    ).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )

    return branch


# ============================================================
# CREATE BRANCH - ADMIN
# ============================================================

@router.post(
    "/",
    response_model=BranchOut,
    status_code=status.HTTP_201_CREATED
)
def create_branch(
    branch_in: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    existing = db.query(Branch).filter(
        Branch.branch_code == branch_in.branch_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Branch code already exists"
        )

    branch = Branch(
        branch_code=branch_in.branch_code,
        branch_name=branch_in.branch_name,
        address=branch_in.address,
        phone=branch_in.phone
    )

    db.add(branch)
    db.commit()
    db.refresh(branch)

    return branch


# ============================================================
# UPDATE BRANCH - ADMIN
# ============================================================

@router.put(
    "/{branch_id}",
    response_model=BranchOut
)
def update_branch(
    branch_id: int,
    branch_in: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    branch = db.query(Branch).filter(
        Branch.id == branch_id
    ).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )

    update_data = branch_in.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(branch, field, value)

    db.commit()
    db.refresh(branch)

    return branch


# ============================================================
# DELETE BRANCH - ADMIN
# ============================================================

@router.delete(
    "/{branch_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    branch = db.query(Branch).filter(
        Branch.id == branch_id
    ).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )

    # Không cho xóa nếu chi nhánh đang có tài khoản
    if branch.accounts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete branch with existing accounts"
        )

    db.delete(branch)
    db.commit()

    return None