from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.transaction import Transaction
from app.services import ai_service
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ClassifyRequest(BaseModel):
    description: str


class AnalyzeRequest(BaseModel):
    transactions: list[dict] | None = None


class ChatRequest(BaseModel):
    messages: list[dict]


@router.post("/classify")
async def classify(req: ClassifyRequest):
    result = await ai_service.classify(req.description)
    return result


@router.post("/analyze-spending")
async def analyze_spending(
    req: AnalyzeRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    transactions_data = req.transactions
    if transactions_data is None:
        txns = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.transaction_date.desc())
            .limit(100)
            .all()
        )
        transactions_data = [t.to_dict() for t in txns]

    result = await ai_service.analyze_spending(transactions_data)
    return result


@router.post("/detect-anomalies")
async def detect_anomalies(
    req: AnalyzeRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    transactions_data = req.transactions
    if transactions_data is None:
        txns = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.transaction_date.desc())
            .limit(100)
            .all()
        )
        transactions_data = [t.to_dict() for t in txns]

    result = await ai_service.detect_anomalies(transactions_data)
    return result


@router.post("/predict-budget")
async def predict_budget(
    req: AnalyzeRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    transactions_data = req.transactions
    if transactions_data is None:
        txns = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.transaction_date.desc())
            .limit(100)
            .all()
        )
        transactions_data = [t.to_dict() for t in txns]

    result = await ai_service.predict_budget(transactions_data)
    return result


@router.post("/tips")
async def tips(
    req: AnalyzeRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    transactions_data = req.transactions
    if transactions_data is None:
        txns = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.transaction_date.desc())
            .limit(100)
            .all()
        )
        transactions_data = [t.to_dict() for t in txns]

    result = await ai_service.get_tips(transactions_data)
    return result


@router.post("/chat")
async def chat(req: ChatRequest):
    result = await ai_service.chat(req.messages)
    return result
