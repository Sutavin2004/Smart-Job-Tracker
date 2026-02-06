from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.job_application import JobApplication
from app.models.application_status_history import ApplicationStatusHistory
from app.schemas.job_application import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    PaginatedApplications,
)

router = APIRouter(prefix="/applications", tags=["applications"])
