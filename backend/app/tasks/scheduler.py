"""
Lightweight background task entry point.

This file defines functions that can be:
- called by cron
- triggered manually
- wired into Celery later
"""

from sqlalchemy.orm import Session

from app.services.ghost_detection import mark_ghosted
from app.services.reminders import generate_followups


def run_scheduled_jobs(db: Session):
    """
    Runs all scheduled background jobs.
    Intended for cron / task runner usage.
    """
    mark_ghosted(db)
    generate_followups(db)
