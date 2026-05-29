from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.saving_goal import SavingGoal
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/saving-goals", tags=["saving-goals"])


class SavingGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: datetime | None = None
    color: str | None = None
    icon: str | None = None


class SavingGoalUpdate(BaseModel):
    name: str | None = None
    target_amount: float | None = None
    current_amount: float | None = None
    deadline: datetime | None = None
    color: str | None = None
    icon: str | None = None
    completed: bool | None = None


@router.get("/")
def list_saving_goals(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    goals = db.query(SavingGoal).filter(SavingGoal.user_id == user_id).order_by(SavingGoal.created_at.desc()).all()
    return {"saving_goals": [g.to_dict() for g in goals]}


@router.get("/{goal_id}")
def get_saving_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    goal = (
        db.query(SavingGoal)
        .filter(SavingGoal.id == goal_id, SavingGoal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meta não encontrada")
    return {"saving_goal": goal.to_dict()}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_saving_goal(
    req: SavingGoalCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    goal = SavingGoal(
        user_id=user_id,
        name=req.name,
        target_amount=req.target_amount,
        current_amount=req.current_amount,
        deadline=req.deadline,
        color=req.color,
        icon=req.icon,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return {"saving_goal": goal.to_dict()}


@router.put("/{goal_id}")
def update_saving_goal(
    goal_id: str,
    req: SavingGoalUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    goal = (
        db.query(SavingGoal)
        .filter(SavingGoal.id == goal_id, SavingGoal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meta não encontrada")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)

    if goal.current_amount >= goal.target_amount:
        goal.completed = True

    goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(goal)

    return {"saving_goal": goal.to_dict()}


@router.delete("/{goal_id}")
def delete_saving_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    goal = (
        db.query(SavingGoal)
        .filter(SavingGoal.id == goal_id, SavingGoal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meta não encontrada")

    db.delete(goal)
    db.commit()

    return {"message": "Meta excluída com sucesso"}
