from sqlalchemy import Column, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base
from app.models.enums import ApplicationStatus


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_application_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )

    status = Column(
        Enum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
    )

    changed_at = Column(DateTime(timezone=True), server_default=func.now())
