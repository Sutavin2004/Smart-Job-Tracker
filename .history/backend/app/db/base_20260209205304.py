# backend/app/db/base.py

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Single SQLAlchemy Base for all models.
    """
    pass
