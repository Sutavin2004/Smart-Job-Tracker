from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.follow_up_reminder import FollowUpReminder
from app.models.job_application import JobApplication
from app.models.enums import ReminderType, ApplicationStatus


def generate_followups(db: Session, days: int = 7):
    cutoff = datetime.utcnow() - timedelta(days=days)

    apps = db.query(JobApplication).filter(
        JobApplication.current_status == ApplicationStatus.applied,
        JobApplication.last_activity_at <= cutoff,
    ).all()

    for app in apps:
        reminder = FollowUpReminder(
            application_id=app.id,
            reminder_type=ReminderType.follow_up,
            remind_at=datetime.utcnow(),
        )
        db.add(reminder)

    db.commit()
