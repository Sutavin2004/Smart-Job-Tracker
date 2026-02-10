# backend/app/models/resume_versions.py

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class ResumeVersion(Base):
    """
    Stores different resume versions uploaded or referenced by a user.
    Used for analytics and application matching later.
    """

    __tablename__ = "resume_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resume_versions")
    applications = relationship(
        "JobApplication",
        back_populates="resume_version",
        cascade="all, delete-orphan",
    )
