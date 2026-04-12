from collections import defaultdict
from typing import List

from sqlalchemy.orm import Session

from app.models.job_application import JobApplication
from app.models.enums import ApplicationStatus
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    BestDayStat,
    TimeToResponseStats,
    ResumePerformanceResponse,
)

RESPONDED_STATUSES = {
    ApplicationStatus.recruiter_screen,
    ApplicationStatus.interview,
    ApplicationStatus.offer,
    ApplicationStatus.rejected,
    ApplicationStatus.ghosted,
    ApplicationStatus.withdrawn,
}

INTERVIEW_STATUSES = {
    ApplicationStatus.interview,
    ApplicationStatus.offer,
}

WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _safe_rate(numerator: int, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator else 0.0


def compute_overview_stats(db: Session, user_id) -> AnalyticsOverviewResponse:
    uid = str(user_id)
    apps: List[JobApplication] = (
        db.query(JobApplication).filter(JobApplication.user_id == uid).all()
    )

    total = len(apps)
    responded = sum(1 for a in apps if a.current_status in RESPONDED_STATUSES)
    interviews = sum(1 for a in apps if a.current_status in INTERVIEW_STATUSES)

    totals_by_day: dict = defaultdict(int)
    resp_by_day: dict = defaultdict(int)
    for app in apps:
        if app.applied_at:
            wd = app.applied_at.weekday()
            totals_by_day[wd] += 1
            if app.current_status in RESPONDED_STATUSES:
                resp_by_day[wd] += 1

    best_days = [
        BestDayStat(
            weekday=wd,
            weekday_name=WEEKDAY_NAMES[wd],
            total_applications=totals_by_day[wd],
            responded_applications=resp_by_day[wd],
            response_rate=_safe_rate(resp_by_day[wd], totals_by_day[wd]),
        )
        for wd in range(7)
    ]

    return AnalyticsOverviewResponse(
        total_applications=total,
        responded_applications=responded,
        response_rate=_safe_rate(responded, total),
        interview_applications=interviews,
        interview_conversion_rate=_safe_rate(interviews, responded),
        time_to_response=TimeToResponseStats(average_days=None, sample_size=0),
        best_days=best_days,
    )


def compute_resume_performance(db: Session, user_id) -> ResumePerformanceResponse:
    return ResumePerformanceResponse(items=[])
