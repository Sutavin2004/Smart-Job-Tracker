# backend/app/models/job_application.py

from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base
from app.models.enums import ApplicationStatus


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    company_name = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    job_location = Column(String, nullable=True)
    job_url = Column(String, nullable=True)

    current_status = Column(
        SQLAlchemyEnum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
    )

    applied_at = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # User <-> JobApplication
    user = relationship("User", back_populates="applications")

    # JobApplication <-> ApplicationStatusHistory
    statuses = relationship(
        "ApplicationStatusHistory",
        back_populates="application",
        cascade="all, delete-orphan",
    )
