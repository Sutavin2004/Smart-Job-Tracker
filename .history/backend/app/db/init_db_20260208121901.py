# app/db/init_db.py

from app.db.database import engine
from app.db.base import Base

# Import ALL models here so SQLAlchemy registers them
from app.models.user import User
from app.models.job_application import JobApplication
from app.models.application_status_history import ApplicationStatusHistory
from app.models.resume_version import ResumeVersion
from app.models.follow_up_reminder import FollowUpReminder


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("✅ Database tables created")
