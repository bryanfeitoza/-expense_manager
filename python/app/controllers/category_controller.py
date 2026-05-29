from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None
    type: str
    monthly_limit: float | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None
    type: str | None = None
    monthly_limit: float | None = None


@router.get("/")
def list_categories(
    type: str | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = db.query(Category).filter(Category.user_id == user_id)
    if type:
        query = query.filter(Category.type == type)
    categories = query.all()
    return {"categories": [c.to_dict() for c in categories]}


@router.get("/{category_id}")
def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    return {"category": category.to_dict()}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_category(
    req: CategoryCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if req.type not in ("receita", "despesa"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo deve ser 'receita' ou 'despesa'")

    category = Category(
        user_id=user_id,
        name=req.name,
        icon=req.icon,
        color=req.color,
        type=req.type,
        monthly_limit=req.monthly_limit,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return {"category": category.to_dict()}


@router.put("/{category_id}")
def update_category(
    category_id: str,
    req: CategoryUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")

    update_data = req.model_dump(exclude_unset=True)
    if "type" in update_data and update_data["type"] not in ("receita", "despesa"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo deve ser 'receita' ou 'despesa'")

    for key, value in update_data.items():
        setattr(category, key, value)

    category.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(category)

    return {"category": category.to_dict()}


@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")

    db.delete(category)
    db.commit()

    return {"message": "Categoria excluída com sucesso"}
