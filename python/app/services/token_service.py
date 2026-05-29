import uuid
from datetime import datetime, timedelta
from hashlib import sha256

from jose import jwt, JWTError

from app.config import settings
from app.database import SessionLocal
from app.models.refresh_token import RefreshToken


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expiry_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_ACCESS_SECRET, algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    raw_token = str(uuid.uuid4())
    hashed_token = sha256(raw_token.encode()).hexdigest()
    expire = datetime.utcnow() + timedelta(minutes=settings.refresh_token_expiry_minutes)

    db = SessionLocal()
    try:
        rt = RefreshToken(
            user_id=user_id,
            token=hashed_token,
            expires_at=expire,
        )
        db.add(rt)
        db.commit()
    finally:
        db.close()

    return raw_token


def verify_refresh_token(token: str) -> RefreshToken | None:
    hashed_token = sha256(token.encode()).hexdigest()

    db = SessionLocal()
    try:
        rt = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token == hashed_token,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.utcnow(),
            )
            .first()
        )
        return rt
    finally:
        db.close()


def revoke_refresh_token(token: str) -> None:
    hashed_token = sha256(token.encode()).hexdigest()

    db = SessionLocal()
    try:
        rt = db.query(RefreshToken).filter(RefreshToken.token == hashed_token).first()
        if rt:
            rt.revoked = True
            db.commit()
    finally:
        db.close()


def revoke_all_user_tokens(user_id: str) -> None:
    db = SessionLocal()
    try:
        tokens = db.query(RefreshToken).filter(RefreshToken.user_id == user_id, RefreshToken.revoked == False).all()
        for rt in tokens:
            rt.revoked = True
        db.commit()
    finally:
        db.close()

    return token


def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


def verify_refresh_token(token: str) -> RefreshToken | None:
    token_hash = sha256(token.encode()).hexdigest()

    db = SessionLocal()
    try:
        rt = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.utcnow(),
            )
            .first()
        )
        return rt
    finally:
        db.close()


def revoke_refresh_token(token: str) -> None:
    token_hash = sha256(token.encode()).hexdigest()

    db = SessionLocal()
    try:
        rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if rt:
            rt.revoked = True
            db.commit()
    finally:
        db.close()


def revoke_all_user_tokens(user_id: str) -> None:
    db = SessionLocal()
    try:
        tokens = db.query(RefreshToken).filter(RefreshToken.user_id == user_id, RefreshToken.revoked == False).all()
        for rt in tokens:
            rt.revoked = True
        db.commit()
    finally:
        db.close()
