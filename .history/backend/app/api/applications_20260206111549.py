from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.job_application import JobApplication
from app.models.application_status import ApplicationStatus
from app.schemas.job_application import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    PaginatedApplications,
)

router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("", response_model=JobApplicationResponse, status_code=201)
def create_application(
    payload: JobApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = JobApplication(
        user_id=current_user.id,
        **payload.dict()
    )
    db.add(application)
    db.flush()

    history = ApplicationStatus(
        application_id=application.id,
        old_status=None,
        new_status=payload.current_status,
    )
    db.add(history)

    db.commit()
    db.refresh(application)
    return application

@router.get("", response_model=PaginatedApplications)
def list_applications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id
    )

    total = query.count()

    items = (
        query
        .order_by(JobApplication.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"total": total, "items": items}
