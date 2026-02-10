from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.job_application import JobApplication
from app.models.application_status import ApplicationStatus
from app.models.enums import ApplicationStatus


def mark_ghosted(db: Session, days: int = 30):
    cutoff = datetime.utcnow() - timedelta(days=days)

    apps = db.query(JobApplication).filter(
        JobApplication.current_status.in_(
            [ApplicationStatus.applied, ApplicationStatus.interview]
        ),
        JobApplication.last_activity_at <= cutoff,
    ).all()

    for app in apps:
        history = ApplicationStatus(
            application_id=app.id,
            old_status=app.current_status,
            new_status=ApplicationStatus.ghosted,
        )
        app.current_status = ApplicationStatus.ghosted
        db.add(history)

    db.commit()
