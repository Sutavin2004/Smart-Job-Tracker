import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resume_version_id = Column(UUID(as_uuid=True), ForeignKey("resume_versions.id"))

    company = Column(String, nullable=False)
    role = Column(String, nullable=False)

    user = relationship("User", back_populates="applications")
    resume_version = relationship("ResumeVersion", back_populates="applications")
    statuses = relationship("ApplicationStatus", back_populates="application")
