# Smart Job Tracker

An AI-powered job search assistant. Tell it what roles and locations you want, and its **Job Agent** searches live job boards, scores every listing against your profile with Claude, and drops the best matches straight onto your board. From there it helps you through the whole process: tailored resumes and cover letters, interview prep, follow-ups and salary negotiation.

**Live app:** https://smart-job-tracker-peach.vercel.app

## Features

| Area | What it does |
|------|--------------|
| **Job Agent** | Searches LinkedIn, Indeed and Glassdoor (via JSearch), Adzuna and RemoteOK for your target roles, ranks results by fit, and saves the top matches. Streams its progress live. |
| **Jobs Board** | Kanban pipeline (saved → applied → interviewing → offer → rejected) with drag and drop, priorities, pins, tags, bulk actions and archive. |
| **AI job analysis** | Per-job fit score, strengths, risks, key skills, salary insight and next steps. Parses job descriptions into keywords and tech stack. |
| **Application tools** | Tailored cover letters, resume tailoring, answers to application questions, and follow-up emails, each generated from the job and your profile. |
| **Interviews & offers** | Interview scheduling and prep, contacts, salary negotiation tracking with AI advice. |
| **Resume Tools** | Analyze your master resume against target roles. |
| **Dashboard, Analytics & Calendar** | Weekly goals, funnel and response-rate stats, an activity heatmap, and upcoming deadlines and interviews. |
| **Tasks & Email Templates** | Per-job to-dos and reusable outreach templates. |
| **Quality of life** | Command palette, keyboard shortcuts, dark mode, CSV export, follow-up reminders. |

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS**, Radix UI, Framer Motion, Recharts
- **Prisma** + **PostgreSQL** (Neon)
- **Anthropic Claude API** for analysis, generation and discovery
- Hosted on **Vercel**; every push to `main` deploys

## Running locally

```bash
git clone https://github.com/Sutavin2004/Smart-Job-Tracker.git
cd Smart-Job-Tracker
npm install

cp .env.example .env      # then fill in the values (see below)
npx prisma migrate deploy # creates the tables
npm run dev               # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Pooled Postgres connection string (Neon) |
| `DATABASE_URL_UNPOOLED` | Yes | Direct connection, used for migrations |
| `ANTHROPIC_API_KEY` | For AI features | Analysis, cover letters, prep and agent ranking. Without it, the AI endpoints return 503 and everything else works. |
| `RAPIDAPI_KEY` | Optional | JSearch (LinkedIn, Indeed, Glassdoor) |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | Optional | Adzuna listings |
| `APP_PASSWORD` | Recommended in production | Puts the whole app and API behind a password screen. Leave it unset to keep the app open (for example in local dev). |

RemoteOK needs no key. On Vercel, the Neon integration sets the two database variables automatically.

## Deployment

The app is deployed on Vercel with a Neon Postgres database attached through the Vercel Marketplace. The build command in `vercel.json` runs `prisma migrate deploy` before `next build`, so schema changes go out with each deploy.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript check |
| `npm run db:migrate` | Create a new migration during development |
| `npm run db:seed` | Load sample data |
| `npm run db:studio` | Browse the database in Prisma Studio |
