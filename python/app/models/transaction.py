import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurring_frequency = Column(String(20), nullable=True)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="transactions")
    category = relationship("Category", backref="transactions")
    account = relationship("Account", backref="transactions")

    __table_args__ = (
        CheckConstraint(type.in_(["receita", "despesa"]), name="ck_transaction_type"),
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "category_id": str(self.category_id) if self.category_id else None,
            "account_id": str(self.account_id) if self.account_id else None,
            "type": self.type,
            "amount": self.amount,
            "description": self.description,
            "transaction_date": self.transaction_date.isoformat() if self.transaction_date else None,
            "is_recurring": self.is_recurring,
            "recurring_frequency": self.recurring_frequency,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
