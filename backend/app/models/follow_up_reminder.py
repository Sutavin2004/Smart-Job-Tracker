from sqlalchemy import Column, String, Date, Boolean, ForeignKey
import uuid

from app.db.base import Base


class FollowUpReminder(Base):
    __tablename__ = "follow_up_reminders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    job_application_id = Column(
        String(36),
        ForeignKey("job_applications.id", ondelete="CASCADE"),
        nullable=False,
    )

    remind_on = Column(Date, nullable=False)
    sent = Column(Boolean, default=False)
