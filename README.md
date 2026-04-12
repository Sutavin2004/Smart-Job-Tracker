# Smart Job Tracker

A full-stack job application tracker with AI-powered suggestions.

- **Backend**: FastAPI + SQLite
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **AI**: Claude (Anthropic API) for application analysis

## Quick Start

### Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY if you want AI suggestions

# Start the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite path | `sqlite:///./jobs.db` |
| `JWT_SECRET_KEY` | Secret for JWT tokens | *(required — change in production)* |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI suggestions | *(optional — app works without it)* |

## Features

- Register / Login with JWT authentication
- Add, edit, delete job applications
- Track status: Applied, Recruiter Screen, Interviewing, Offer, Rejected, etc.
- Color-coded status badges
- AI-powered next-step suggestions via Claude
- Dashboard with stats (total, interviewing, offers)
- Kanban board view

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and get JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/applications` | List all applications |
| `POST` | `/applications` | Create a new application |
| `GET` | `/applications/{id}` | Get a single application |
| `PUT` | `/applications/{id}` | Update an application |
| `DELETE` | `/applications/{id}` | Delete an application |
| `POST` | `/applications/{id}/analyze` | Get AI suggestion for an application |
| `GET` | `/analytics/overview` | Get analytics overview |
