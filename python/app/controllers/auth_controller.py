from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Body
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.token_service import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
)
from app.middleware.auth import get_current_user, get_current_user_id

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str = None
    refreshToken: str = None

    @property
    def resolved_token(self) -> str:
        return self.refreshToken or self.refresh_token


class AuthResponse(BaseModel):
    user: dict
    access_token: str
    refresh_token: str | None = None


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")

    user = User(name=req.name, email=req.email)
    user.set_password(req.password)
    if req.phone:
        user.phone = req.phone

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(str(user.id))

    return AuthResponse(
        user=user.to_dict(),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.check_password(req.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(str(user.id))

    return AuthResponse(
        user=user.to_dict(),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=AuthResponse)
def refresh(req: RefreshRequest):
    token = req.resolved_token
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh token é obrigatório")

    rt = verify_refresh_token(token)
    if rt is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido ou expirado")

    revoke_refresh_token(token)

    access_token = create_access_token({"sub": str(rt.user_id)})
    new_refresh_token = create_refresh_token(str(rt.user_id))

    return AuthResponse(
        user={"id": str(rt.user_id)},
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


class LogoutRequest(BaseModel):
    refresh_token: str = None
    refreshToken: str = None

    @property
    def resolved_token(self) -> str | None:
        return self.refreshToken or self.refresh_token


@router.post("/logout")
def logout(
    req: LogoutRequest = Body(...),
    user_id: str = Depends(get_current_user_id),
):
    token = req.resolved_token
    if token:
        revoke_refresh_token(token)
    else:
        revoke_all_user_tokens(user_id)
    return {"message": "Logout realizado com sucesso"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"user": user.to_dict()}
