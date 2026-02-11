# backend/app/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Union

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT algorithm used for both access and refresh tokens
ALGORITHM = settings.JWT_ALGORITHM


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password exceeds bcrypt 72-byte limit")
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    expires_delta: Union[timedelta, None] = None,
) -> str:
    """
    Create a signed JWT access token for a given subject (user id).
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta

    to_encode = {
        "sub": str(subject),     # always string
        "type": "access",        # identify token type
        "exp": expire,
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(
    subject: str,
    expires_delta: Union[timedelta, None] = None,
) -> str:
    """
    Create a signed JWT refresh token for a given subject (user id).
    """
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    expire = datetime.now(timezone.utc) + expires_delta

    to_encode = {
        "sub": str(subject),     # always string
        "type": "refresh",       # identify token type
        "exp": expire,
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return encoded_jwt

