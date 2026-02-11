from sqlalchemy import Column, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base


class FollowUpReminder(Base):
    __tablename__ = "follow_up_reminders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_application_id = Column(UUID(as_uuid=True), nullable=False)

    remind_on = Column(Date, nullable=False)
    sent = Column(Boolean, default=False)
