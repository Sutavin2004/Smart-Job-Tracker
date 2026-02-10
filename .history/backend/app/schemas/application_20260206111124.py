from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime

from app.models.enums import ApplicationStatus


class JobApplicationCreate(BaseModel):
    company_name: str
    job_title: str
    job_location: Optional[str] = None
    job_url: Optional[HttpUrl] = None
    current_status: ApplicationStatus
    applied_at: Optional[date] = None
    notes: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_location: Optional[str] = None
    job_url: Optional[HttpUrl] = None
    current_status: Optional[ApplicationStatus] = None
    applied_at: Optional[date] = None
    notes: Optional[str] = None


class JobApplicationResponse(BaseModel):
    id: UUID
    company_name: str
    job_title: str
    job_location: Optional[str]
    job_url: Optional[str]
    current_status: ApplicationStatus
    applied_at: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedApplications(BaseModel):
    total: int
    items: List[JobApplicationResponse]
