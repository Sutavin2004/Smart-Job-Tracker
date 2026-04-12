from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, func
import uuid

from app.db.base import Base
from app.models.enums import ApplicationStatus


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    job_application_id = Column(
        String(36),
        ForeignKey("job_applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(
        Enum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
