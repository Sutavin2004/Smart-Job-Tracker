# Smart Job Tracker

A full-stack job application tracker with AI-powered next-step suggestions.

| Layer | Tech | Hosting |
|-------|------|---------|
| Backend | FastAPI + SQLite | Render (free tier, always on) |
| Frontend | React + TypeScript + Vite | GitHub Pages (free, always on) |
| AI | Claude (Anthropic API) | via backend |

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://sutavin2004.github.io/Smart-Job-Tracker/ |
| Backend API | https://smart-job-tracker-api.onrender.com |
| API Docs | https://smart-job-tracker-api.onrender.com/docs |
| Health check | https://smart-job-tracker-api.onrender.com/health |

> **Note:** Render free tier spins down after 15 min of inactivity. The first request after idle may take ~30 seconds.

---

## Local Development

### Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) add your Anthropic key for AI suggestions
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY

# Run from the PROJECT ROOT (not inside backend/)
cd ..
uvicorn backend.main:app --reload
```

API available at `http://localhost:8000`.  
Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

The dev server points to `http://localhost:8000` via `.env.development`.

---

## Deploying

### Backend → Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub account and select `Sutavin2004/Smart-Job-Tracker`
3. Render auto-detects `render.yaml` — no manual config needed
4. In the Environment section, add:
   - `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
5. Click **Create Web Service** — first deploy takes ~2 min

### Frontend → GitHub Pages

GitHub Actions deploys automatically on every push to `main`.

To enable GitHub Pages the first time:
1. Push the code (the Actions workflow creates the `gh-pages` branch)
2. Go to **Settings → Pages**
3. Set **Source** to **Deploy from a branch**
4. Select branch: `gh-pages`, folder: `/ (root)`
5. Save — the site will be live at `https://sutavin2004.github.io/Smart-Job-Tracker/`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/jobs` | List all jobs |
| `POST` | `/jobs` | Create a job |
| `PUT` | `/jobs/{id}` | Update a job |
| `DELETE` | `/jobs/{id}` | Delete a job |
| `POST` | `/jobs/{id}/analyze` | Get AI suggestion (Claude) |

### Job fields

```json
{
  "id": 1,
  "company": "Acme Corp",
  "role": "Software Engineer",
  "status": "applied",
  "date_applied": "2026-04-12",
  "job_url": "https://acme.com/jobs/123",
  "notes": "Referred by Jane",
  "ai_suggestion": "Follow up with your contact at Acme..."
}
```

**Status values:** `saved` · `applied` · `interviewing` · `offered` · `rejected`
