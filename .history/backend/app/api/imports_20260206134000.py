import csv
from fastapi import APIRouter, Depends, UploadFile, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.api.deps import get_current_user, get_db
from app.models.job_application import JobApplication
from app.models.user import User
from app.models.enums import ApplicationStatus

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post("/csv")
def import_csv(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    reader = csv.DictReader(line.decode("utf-8") for line in file.file)

    inserted = 0
    skipped = 0

    for row in reader:
        company = row["company"].strip().lower()
        title = row["job_title"].strip().lower()

        exists = db.query(JobApplication).filter(
            JobApplication.user_id == current_user.id,
            JobApplication.company_name.ilike(company),
            JobApplication.job_title.ilike(title),
        ).first()

        if exists:
            skipped += 1
            continue

        app = JobApplication(
            user_id=current_user.id,
            company_name=row["company"],
            job_title=row["job_title"],
            current_status=ApplicationStatus.applied,
            applied_at=date.today(),
        )
        db.add(app)
        inserted += 1

    db.commit()
    return {"inserted": inserted, "skipped": skipped}
