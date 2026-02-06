from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    ResumePerformanceResponse,
)
from app.services.analytics import (
    compute_overview_stats,
    compute_resume_performance,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns high-level pipeline stats for the current user:
    - total applications
    - response rate
    - interview conversion
    - time-to-response
    - best days to apply
    """
    return compute_overview_stats(db, current_user.id)


@router.get("/resumes", response_model=ResumePerformanceResponse)
def get_resume_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns performance metrics for each resume version:
    - total applications
    - response rate
    - interview rate
    """
    return compute_resume_performance(db, current_user.id)
