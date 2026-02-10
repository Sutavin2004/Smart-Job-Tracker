from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.job_application import JobApplication
from backend.app.models.application_status import ApplicationStatus
from app.models.resume_versions import ResumeVersion  # make sure this model exists
from app.models.enums import ApplicationStatus
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    BestDayStat,
    TimeToResponseStats,
    ResumePerformanceEntry,
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
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 4)


def compute_overview_stats(db: Session, user_id) -> AnalyticsOverviewResponse:
    # Total applications
    total_applications: int = (
        db.query(func.count(JobApplication.id))
        .filter(JobApplication.user_id == user_id)
        .scalar()
        or 0
    )

    # Responded applications
    responded_applications: int = (
        db.query(func.count(JobApplication.id))
        .filter(
            JobApplication.user_id == user_id,
            JobApplication.current_status.in_(RESPONDED_STATUSES),
        )
        .scalar()
        or 0
    )

    # Interview applications
    interview_applications: int = (
        db.query(func.count(JobApplication.id))
        .filter(
            JobApplication.user_id == user_id,
            JobApplication.current_status.in_(INTERVIEW_STATUSES),
        )
        .scalar()
        or 0
    )

    response_rate = _safe_rate(responded_applications, total_applications)
    interview_conversion_rate = _safe_rate(
        interview_applications,
        total_applications,
    )

    time_to_response_stats = _compute_time_to_response(db, user_id)
    best_days_stats = _compute_best_days(db, user_id)

    return AnalyticsOverviewResponse(
        total_applications=total_applications,
        responded_applications=responded_applications,
        response_rate=response_rate,
        interview_applications=interview_applications,
        interview_conversion_rate=interview_conversion_rate,
        time_to_response=time_to_response_stats,
        best_days=best_days_stats,
    )


def _compute_time_to_response(db: Session, user_id) -> TimeToResponseStats:
    """
    For each application, find the FIRST non-applied response in history
    and compute days between applied_at/created_at and that response.
    """

    # Join history with applications so we can filter by user
    rows: List[Tuple] = (
        db.query(
            JobApplication.id,
            JobApplication.applied_at,
            JobApplication.created_at,
            ApplicationStatus.changed_at,
            ApplicationStatus.new_status,
        )
        .join(
            ApplicationStatus,
            ApplicationStatus.application_id == JobApplication.id,
        )
        .filter(
            JobApplication.user_id == user_id,
            ApplicationStatus.new_status.not_in(
                [ApplicationStatus.draft, ApplicationStatus.applied]
            ),
        )
        .order_by(
            JobApplication.id,
            ApplicationStatus.changed_at.asc(),
        )
        .all()
    )

    # For each application, keep only the first response event
    first_response_per_app: Dict = {}
    for app_id, applied_at, created_at, changed_at, new_status in rows:
        if app_id in first_response_per_app:
            continue
        first_response_per_app[app_id] = (applied_at, created_at, changed_at)

    deltas: List[float] = []
    for app_id, (applied_at, created_at, changed_at) in first_response_per_app.items():
        start: datetime = applied_at or created_at
        if not start or not changed_at:
            continue
        delta_days = (changed_at - start).total_seconds() / 86400.0
        deltas.append(delta_days)

    if not deltas:
        return TimeToResponseStats(average_days=None, sample_size=0)

    avg_days = round(sum(deltas) / len(deltas), 2)
    return TimeToResponseStats(average_days=avg_days, sample_size=len(deltas))


def _compute_best_days(db: Session, user_id) -> List[BestDayStat]:
    apps: List[JobApplication] = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user_id)
        .all()
    )

    totals = defaultdict(int)
    responded = defaultdict(int)

    for app in apps:
        if not app.applied_at:
            continue

        weekday = app.applied_at.weekday()  # 0 = Monday
        totals[weekday] += 1

        if app.current_status in RESPONDED_STATUSES:
            responded[weekday] += 1

    stats: List[BestDayStat] = []
    for weekday in range(7):
        total = totals[weekday]
        resp = responded[weekday]
        rate = _safe_rate(resp, total) if total > 0 else 0.0

        stats.append(
            BestDayStat(
                weekday=weekday,
                weekday_name=WEEKDAY_NAMES[weekday],
                total_applications=total,
                responded_applications=resp,
                response_rate=rate,
            )
        )

    return stats


def compute_resume_performance(db: Session, user_id) -> ResumePerformanceResponse:
    resumes: List[ResumeVersion] = (
        db.query(ResumeVersion)
        .filter(ResumeVersion.user_id == user_id)
        .order_by(ResumeVersion.created_at.asc())
        .all()
    )

    # Preload all applications for this user to avoid N+1 queries
    apps: List[JobApplication] = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user_id)
        .all()
    )

    # Group applications by resume_id
    apps_by_resume: Dict[str, List[JobApplication]] = defaultdict(list)
    for app in apps:
        if app.resume_id:
            apps_by_resume[str(app.resume_id)].append(app)

    items: List[ResumePerformanceEntry] = []

    for resume in resumes:
        key = str(resume.id)
        resume_apps = apps_by_resume.get(key, [])

        total = len(resume_apps)
        if total == 0:
            continue

        responded_count = sum(
            1 for a in resume_apps if a.current_status in RESPONDED_STATUSES
        )
        interview_count = sum(
            1 for a in resume_apps if a.current_status in INTERVIEW_STATUSES
        )

        items.append(
            ResumePerformanceEntry(
                resume_id=resume.id,
                resume_name=resume.name,
                created_at=resume.created_at.date(),
                total_applications=total,
                responded_applications=responded_count,
                response_rate=_safe_rate(responded_count, total),
                interview_applications=interview_count,
                interview_rate=_safe_rate(interview_count, total),
            )
        )

    return ResumePerformanceResponse(items=items)
