# backend/app/models/application_status.py

from sqlalchemy import (
    Column,
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


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("job_applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(
        SQLAlchemyEnum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
    )

    changed_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    note = Column(Text, nullable=True)

    # This points back to JobApplication.statuses
    application = relationship("JobApplication", back_populates="statuses")
