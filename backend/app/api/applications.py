import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.job_application import JobApplication
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationRead,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


# =========================
# Create application
# =========================
@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = JobApplication(
        user_id=str(current_user.id),
        company=data.company,
        role=data.role,
        job_location=data.job_location,
        job_url=str(data.job_url) if data.job_url else None,
        current_status=data.status,
        applied_at=data.applied_at,
        notes=data.notes,
        resume_version_id=data.resume_version_id,
    )

    db.add(application)
    db.commit()
    db.refresh(application)

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
        .filter(JobApplication.user_id == str(current_user.id))
        .order_by(JobApplication.created_at.desc())
        .all()
    )


# =========================
# Get single application
# =========================
@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == str(current_user.id),
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
    application_id: str,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == str(current_user.id),
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "job_url" and value is not None:
            value = str(value)
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return application


# =========================
# Delete application
# =========================
@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == str(current_user.id),
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(application)
    db.commit()

    return None


# =========================
# AI analyze endpoint
# =========================
@router.post("/{application_id}/analyze", response_model=ApplicationRead)
def analyze_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == str(current_user.id),
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        application.ai_suggestion = (
            "AI suggestions unavailable — set ANTHROPIC_API_KEY in backend/.env to enable this feature."
        )
        db.commit()
        db.refresh(application)
        return application

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        prompt = (
            f"Given this job application:\n"
            f"Company: {application.company}\n"
            f"Role: {application.role}\n"
            f"Status: {application.current_status.value}\n"
            f"Notes: {application.notes or 'None'}\n\n"
            f"What should the applicant do next to maximize their chances? "
            f"Be concise (2-3 sentences)."
        )

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )

        suggestion = message.content[0].text
    except Exception as exc:
        suggestion = f"AI analysis failed: {exc}"

    application.ai_suggestion = suggestion
    db.commit()
    db.refresh(application)

    return application
