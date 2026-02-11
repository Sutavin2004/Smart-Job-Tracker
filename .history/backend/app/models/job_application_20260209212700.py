# app/models/job_application.py

from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base
from app.models.enums import ApplicationStatus


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    company_name = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    job_location = Column(String)
    job_url = Column(String)
    current_status = Column(
        SQLAlchemyEnum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
    )

    applied_at = Column(Date)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ✅ MATCHING RELATIONSHIP
    user = relationship("User", back_populates="applications")
