from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


class AccountCreate(BaseModel):
    name: str
    type: str
    balance: float = 0.0
    currency: str = "BRL"


class AccountUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    balance: float | None = None
    currency: str | None = None


@router.get("/")
def list_accounts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    return {"accounts": [a.to_dict() for a in accounts]}


@router.get("/{account_id}")
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == user_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada")
    return {"account": account.to_dict()}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_account(
    req: AccountCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    account = Account(
        user_id=user_id,
        name=req.name,
        type=req.type,
        balance=req.balance,
        currency=req.currency,
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    return {"account": account.to_dict()}


@router.put("/{account_id}")
def update_account(
    account_id: str,
    req: AccountUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == user_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(account, key, value)

    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)

    return {"account": account.to_dict()}


@router.delete("/{account_id}")
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == user_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada")

    db.delete(account)
    db.commit()

    return {"message": "Conta excluída com sucesso"}
