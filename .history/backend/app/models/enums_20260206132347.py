import enum

class ApplicationStatus(str, enum.Enum):
    draft = "draft"
    applied = "applied"
    recruiter_screen = "recruiter_screen"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"
    ghosted = "ghosted"
    withdrawn = "withdrawn"

class ReminderType(str, enum.Enum):
    follow_up = "follow_up"