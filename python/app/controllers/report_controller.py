import csv
from datetime import datetime, timedelta
from io import StringIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/by-category")
def by_category(
    start_date: str = Query(None),
    end_date: str = Query(None),
    type: str | None = Query(None, regex="^(receita|despesa)$"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = (
        db.query(
            Category.name,
            Category.icon,
            Category.color,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .join(Transaction, Transaction.category_id == Category.id, isouter=True)
        .filter(Category.user_id == user_id)
    )

    if type:
        query = query.filter(Category.type == type)
    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.fromisoformat(end_date))

    results = query.group_by(Category.id, Category.name, Category.icon, Category.color).all()

    categories = [
        {
            "name": r.name,
            "icon": r.icon,
            "color": r.color,
            "total": round(r.total, 2),
            "count": r.count,
        }
        for r in results
    ]

    return {"categories": categories}


@router.get("/monthly")
def monthly(
    year: int = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if year is None:
        year = datetime.utcnow().year

    results = (
        db.query(
            func.extract("month", Transaction.transaction_date).label("month"),
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .filter(
            Transaction.user_id == user_id,
            func.extract("year", Transaction.transaction_date) == year,
        )
        .group_by("month", Transaction.type)
        .order_by("month")
        .all()
    )

    months = {}
    for r in results:
        m = int(r.month)
        if m not in months:
            months[m] = {"month": m, "receitas": 0, "despesas": 0, "count": 0}
        months[m][r.type] = round(r.total, 2)
        months[m]["count"] += r.count

    return {"year": year, "months": list(months.values())}


@router.get("/export-csv")
def export_csv(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.fromisoformat(end_date))

    transactions = query.order_by(Transaction.transaction_date.desc()).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "type", "amount", "description", "category_id", "account_id", "transaction_date", "is_recurring", "notes"])

    for t in transactions:
        writer.writerow([
            str(t.id),
            t.type,
            t.amount,
            t.description,
            str(t.category_id) if t.category_id else "",
            str(t.account_id) if t.account_id else "",
            t.transaction_date.isoformat() if t.transaction_date else "",
            t.is_recurring,
            t.notes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
