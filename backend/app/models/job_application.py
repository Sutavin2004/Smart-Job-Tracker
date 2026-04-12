from sqlalchemy import Column, String, Date, DateTime, Enum, Text, func
import uuid

from app.db.base import Base
from app.models.enums import ApplicationStatus


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)

    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    job_location = Column(String, nullable=True)
    job_url = Column(String, nullable=True)

    current_status = Column(
        Enum(ApplicationStatus, name="application_status"),
        nullable=False,
        default=ApplicationStatus.applied,
    )

    applied_at = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    ai_suggestion = Column(Text, nullable=True)
    resume_version_id = Column(String(36), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
