from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime

from app.models.enums import ApplicationStatus


# =========================
# Status timeline schemas
# =========================
class ApplicationStatusCreate(BaseModel):
    status: ApplicationStatus


class ApplicationStatusRead(BaseModel):
    id: UUID
    status: ApplicationStatus
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# Application schemas
# =========================
class ApplicationCreate(BaseModel):
    company: str
    role: str
    job_location: Optional[str] = None
    job_url: Optional[HttpUrl] = None
    status: ApplicationStatus
    applied_at: Optional[date] = None
    notes: Optional[str] = None
    resume_version_id: Optional[UUID] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    job_location: Optional[str] = None
    job_url: Optional[HttpUrl] = None
    applied_at: Optional[date] = None
    notes: Optional[str] = None
    resume_version_id: Optional[UUID] = None


class ApplicationRead(BaseModel):
    id: UUID
    company: str
    role: str
    job_location: Optional[str]
    job_url: Optional[str]
    applied_at: Optional[date]
    notes: Optional[str]
    resume_version_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    statuses: List[ApplicationStatusRead] = []

    class Config:
        from_attributes = True


class PaginatedApplications(BaseModel):
    total: int
    items: List[ApplicationRead]
