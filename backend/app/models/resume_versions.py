from sqlalchemy import Column, String, DateTime, ForeignKey, func
import uuid

from app.db.base import Base


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), nullable=False, index=True)

    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
