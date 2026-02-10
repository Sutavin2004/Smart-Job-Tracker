import uuid
from sqlalchemy import Column, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import ApplicationStatus


class ApplicationStatus(Base):
    __tablename__ = "application_status"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False)

    old_status = Column(Enum(ApplicationStatus))
    new_status = Column(Enum(ApplicationStatus), nullable=False)

    changed_at = Column(DateTime(timezone=True), server_default=func.now())
