from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(
    period: str = Query("month", regex="^(week|month|year)$"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)

    receitas = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "receita",
            Transaction.transaction_date >= start_date,
        )
        .scalar()
    )

    despesas = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "despesa",
            Transaction.transaction_date >= start_date,
        )
        .scalar()
    )

    total_transactions = (
        db.query(func.count(Transaction.id))
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start_date,
        )
        .scalar()
    )

    balance = receitas - despesas

    return {
        "receitas": round(receitas, 2),
        "despesas": round(despesas, 2),
        "balance": round(balance, 2),
        "total_transactions": total_transactions,
        "period": period,
    }


@router.get("/monthly-evolution")
def monthly_evolution(
    year: int = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if year is None:
        year = datetime.utcnow().year

    results = (
        db.query(
            extract("month", Transaction.transaction_date).label("month"),
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.user_id == user_id,
            extract("year", Transaction.transaction_date) == year,
        )
        .group_by("month", Transaction.type)
        .order_by("month")
        .all()
    )

    months = []
    for r in results:
        months.append({
            "month": int(r.month),
            "type": r.type,
            "total": round(r.total, 2),
        })

    return {"year": year, "months": months}


@router.get("/category-breakdown")
def category_breakdown(
    start_date: str = Query(None),
    end_date: str = Query(None),
    type: str = Query("despesa", regex="^(receita|despesa)$"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = (
        db.query(
            Category.name,
            Category.icon,
            Category.color,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .join(Transaction, Transaction.category_id == Category.id, isouter=True)
        .filter(Category.user_id == user_id, Category.type == type)
    )

    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.fromisoformat(end_date))

    results = query.group_by(Category.id, Category.name, Category.icon, Category.color).all()

    total = sum(r.total for r in results)

    categories = []
    for r in results:
        percentage = round((r.total / total * 100), 2) if total > 0 else 0
        categories.append({
            "name": r.name,
            "icon": r.icon,
            "color": r.color,
            "total": round(r.total, 2),
            "percentage": percentage,
        })

    return {
        "type": type,
        "total": round(total, 2),
        "categories": categories,
    }
