from pydantic import BaseModel
from typing import List
from uuid import UUID
from app.models.enums import ApplicationStatus


class BulkStatusUpdate(BaseModel):
    application_ids: List[UUID]
    new_status: ApplicationStatus
