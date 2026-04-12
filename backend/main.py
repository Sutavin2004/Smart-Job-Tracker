"""
Smart Job Tracker — Render-deployable FastAPI backend.
Uses stdlib sqlite3 (no external DB required).
Run from project root: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
"""
import os
import sqlite3
from datetime import date
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# DB lives next to this file so Render's ephemeral FS works
DB_PATH = Path(__file__).parent / "jobs.db"

app = FastAPI(title="Smart Job Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────
# Database helpers
# ─────────────────────────────────────────

def _conn() -> sqlite3.Connection:
    con = sqlite3.connect(str(DB_PATH))
    con.row_factory = sqlite3.Row
    return con


def _init_db() -> None:
    with _conn() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                company      TEXT NOT NULL,
                role         TEXT NOT NULL,
                status       TEXT NOT NULL DEFAULT 'applied',
                date_applied TEXT NOT NULL,
                job_url      TEXT,
                notes        TEXT,
                ai_suggestion TEXT
            )
        """)
        con.commit()


_init_db()


# ─────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────

class JobBase(BaseModel):
    company: str
    role: str
    status: str = "applied"
    job_url: Optional[str] = None
    notes: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None


class Job(JobBase):
    id: int
    date_applied: str
    ai_suggestion: Optional[str] = None

    class Config:
        from_attributes = True


def _row_to_job(row: sqlite3.Row) -> Job:
    return Job(
        id=row["id"],
        company=row["company"],
        role=row["role"],
        status=row["status"],
        date_applied=row["date_applied"],
        job_url=row["job_url"],
        notes=row["notes"],
        ai_suggestion=row["ai_suggestion"],
    )


# ─────────────────────────────────────────
# Routes
# ─────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/jobs", response_model=List[Job])
def list_jobs():
    with _conn() as con:
        rows = con.execute("SELECT * FROM jobs ORDER BY id DESC").fetchall()
    return [_row_to_job(r) for r in rows]


@app.post("/jobs", response_model=Job, status_code=201)
def create_job(data: JobCreate):
    today = str(date.today())
    with _conn() as con:
        cur = con.execute(
            "INSERT INTO jobs (company, role, status, date_applied, job_url, notes)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (data.company, data.role, data.status, today, data.job_url, data.notes),
        )
        con.commit()
        row = con.execute("SELECT * FROM jobs WHERE id = ?", (cur.lastrowid,)).fetchone()
    return _row_to_job(row)


@app.put("/jobs/{job_id}", response_model=Job)
def update_job(job_id: int, data: JobUpdate):
    with _conn() as con:
        row = con.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")

        fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if fields:
            set_clause = ", ".join(f"{k} = ?" for k in fields)
            con.execute(
                f"UPDATE jobs SET {set_clause} WHERE id = ?",
                [*fields.values(), job_id],
            )
            con.commit()
        row = con.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return _row_to_job(row)


@app.delete("/jobs/{job_id}", status_code=204)
def delete_job(job_id: int):
    with _conn() as con:
        row = con.execute("SELECT id FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        con.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        con.commit()


@app.post("/jobs/{job_id}/analyze", response_model=Job)
def analyze_job(job_id: int):
    with _conn() as con:
        row = con.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        job = _row_to_job(row)

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if not api_key:
        suggestion = "Add your Anthropic API key to enable AI suggestions."
    else:
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=api_key)
            prompt = (
                f"Job application — Company: {job.company}, Role: {job.role}, "
                f"Status: {job.status}, Notes: {job.notes or 'None'}. "
                f"In 2-3 sentences, what should the applicant do next to maximize their chances?"
            )
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}],
            )
            suggestion = message.content[0].text
        except Exception as exc:
            suggestion = f"AI analysis failed: {exc}"

    with _conn() as con:
        con.execute(
            "UPDATE jobs SET ai_suggestion = ? WHERE id = ?", (suggestion, job_id)
        )
        con.commit()
        row = con.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return _row_to_job(row)
