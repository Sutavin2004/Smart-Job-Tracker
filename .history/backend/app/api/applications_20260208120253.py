from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.job_application import JobApplication
from app.models.application_status import ApplicationStatus
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationRead,
    ApplicationStatusCreate,
    ApplicationStatusRead,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


# =========================
# Create application
# =========================
@router.post(
    "",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = JobApplication(
        user_id=current_user.id,
        company=data.company,
        role=data.role,
        resume_version_id=data.resume_version_id,
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    # Initial status
    initial_status = ApplicationStatus(
        application_id=application.id,
        status=data.status,
    )
    db.add(initial_status)
    db.commit()

    return application


# =========================
# Get all applications
# =========================
@router.get("", response_model=List[ApplicationRead])
def get_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(JobApplication)
        .filter(JobApplication.user_id == current_user.id)
        .all()
    )


# =========================
# Get single application
# =========================
@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    return application


# =========================
# Update application
# =========================
@router.put("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: UUID,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return application


# =========================
# Delete application
# =========================
@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(application)
    db.commit()

    return None


# =========================
# Add status update
# =========================
@router.post(
    "/{application_id}/status",
    response_model=ApplicationStatusRead,
    status_code=status.HTTP_201_CREATED,
)
def add_application_status(
    application_id: UUID,
    data: ApplicationStatusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    status_entry = ApplicationStatus(
        application_id=application.id,
        status=data.status,
    )

    db.add(status_entry)
    db.commit()
    db.refresh(status_entry)

    return status_entry
