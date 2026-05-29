from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.transaction import Transaction
from app.services.ai_service import classify
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


class TransactionCreate(BaseModel):
    category_id: str | None = None
    account_id: str | None = None
    type: str
    amount: float
    description: str | None = None
    transaction_date: datetime | None = None
    is_recurring: bool = False
    recurring_frequency: str | None = None
    notes: str | None = None


class TransactionUpdate(BaseModel):
    category_id: str | None = None
    account_id: str | None = None
    type: str | None = None
    amount: float | None = None
    description: str | None = None
    transaction_date: datetime | None = None
    is_recurring: bool | None = None
    recurring_frequency: str | None = None
    notes: str | None = None


@router.get("/")
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: str | None = None,
    category_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    sort: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = db.query(Transaction).filter(Transaction.user_id == user_id)

    if type:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.fromisoformat(end_date))

    total = query.count()

    order = desc(Transaction.transaction_date) if sort == "desc" else Transaction.transaction_date
    transactions = query.order_by(order).offset((page - 1) * limit).limit(limit).all()

    return {
        "transactions": [t.to_dict() for t in transactions],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.get("/{transaction_id}")
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    return {"transaction": transaction.to_dict()}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    req: TransactionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if not req.category_id and req.description:
        classification = await classify(req.description)
        category_id = classification.get("category_id")
        if category_id:
            req.category_id = category_id
        if not req.type and classification.get("type"):
            req.type = classification["type"]

    transaction = Transaction(
        user_id=user_id,
        category_id=req.category_id,
        account_id=req.account_id,
        type=req.type,
        amount=req.amount,
        description=req.description,
        transaction_date=req.transaction_date or datetime.utcnow(),
        is_recurring=req.is_recurring,
        recurring_frequency=req.recurring_frequency,
        notes=req.notes,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {"transaction": transaction.to_dict()}


@router.put("/{transaction_id}")
def update_transaction(
    transaction_id: str,
    req: TransactionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transaction, key, value)

    transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(transaction)

    return {"transaction": transaction.to_dict()}


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")

    db.delete(transaction)
    db.commit()

    return {"message": "Transação excluída com sucesso"}
