from app.db.database import engine
from app.db.base import Base

# Import all models so their tables are registered with Base.metadata
from app.models.user import User  # noqa: F401
from app.models.job_application import JobApplication  # noqa: F401
from app.models.application_status import ApplicationStatusHistory  # noqa: F401
from app.models.resume_versions import ResumeVersion  # noqa: F401
from app.models.follow_up_reminder import FollowUpReminder  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created")
