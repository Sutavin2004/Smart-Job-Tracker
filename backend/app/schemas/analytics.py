from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class TimeToResponseStats(BaseModel):
    average_days: Optional[float]
    sample_size: int


class BestDayStat(BaseModel):
    weekday: int               # 0 = Monday ... 6 = Sunday
    weekday_name: str
    total_applications: int
    responded_applications: int
    response_rate: float


class AnalyticsOverviewResponse(BaseModel):
    total_applications: int
    responded_applications: int
    response_rate: float
    interview_applications: int
    interview_conversion_rate: float
    time_to_response: TimeToResponseStats
    best_days: List[BestDayStat]


class ResumePerformanceEntry(BaseModel):
    resume_id: UUID
    resume_name: str
    created_at: date
    total_applications: int
    responded_applications: int
    response_rate: float
    interview_applications: int
    interview_rate: float


class ResumePerformanceResponse(BaseModel):
    items: List[ResumePerformanceEntry]
