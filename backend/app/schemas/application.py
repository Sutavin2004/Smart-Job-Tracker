from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.models.enums import ApplicationStatus


class ApplicationStatusHistoryRead(BaseModel):
    id: str
    status: ApplicationStatus
    created_at: datetime

    class Config:
        from_attributes = True


# Keep old name as alias for any code that still uses it
ApplicationStatusRead = ApplicationStatusHistoryRead


class ApplicationCreate(BaseModel):
    company: str
    role: str
    job_location: Optional[str] = None
    job_url: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.applied
    applied_at: Optional[date] = None
    notes: Optional[str] = None
    resume_version_id: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    job_location: Optional[str] = None
    job_url: Optional[str] = None
    current_status: Optional[ApplicationStatus] = None
    applied_at: Optional[date] = None
    notes: Optional[str] = None
    resume_version_id: Optional[str] = None


class ApplicationRead(BaseModel):
    id: str
    company: str
    role: str
    job_location: Optional[str] = None
    job_url: Optional[str] = None
    current_status: ApplicationStatus
    applied_at: Optional[date] = None
    notes: Optional[str] = None
    ai_suggestion: Optional[str] = None
    resume_version_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Legacy alias used by some routes
ApplicationStatusCreate = ApplicationStatusHistoryRead


class PaginatedApplications(BaseModel):
    total: int
    items: List[ApplicationRead]
