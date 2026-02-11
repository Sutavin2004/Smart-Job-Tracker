from app.db.database import engine
from app.db.base import Base

# Import models ONLY here
from app.models.user import User
from app.models.job_application import JobApplication
from app.models.application_status import ApplicationStatus
from app.models.resume_versions import ResumeVersion
from app.models.follow_up_reminder import FollowUpReminder


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("✅ Database tables created")
