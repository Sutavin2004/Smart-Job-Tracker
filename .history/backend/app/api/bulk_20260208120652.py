from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.bulk import BulkStatusUpdate
from app.models.job_application import JobApplication
from backend.app.models.application_status import ApplicationStatus
from app.models.user import User

router = APIRouter(prefix="/bulk", tags=["bulk"])


@router.post("/status")
def bulk_update_status(
    payload: BulkStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    apps = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.id.in_(payload.application_ids),
    ).all()

    for app in apps:
        if app.current_status != payload.new_status:
            history = ApplicationStatus(
                application_id=app.id,
                old_status=app.current_status,
                new_status=payload.new_status,
            )
            app.current_status = payload.new_status
            db.add(history)

    db.commit()
    return {"updated": len(apps)}
