from sqlalchemy import Column, String, Date, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base
from app.models.enums import ApplicationStatus

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)

    company_name = Column(String, nullable=False)
    job_title = Column(String, nullable=False)

    current_status = Column(
        Enum(ApplicationStatus, name="application_status"),
        nullable=False,
    )

    applied_at = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
