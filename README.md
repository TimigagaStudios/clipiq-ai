# ClipIQ AI

AI-powered SaaS that turns long videos into viral short-form clips — automatic
clip detection, captions, hashtags, thumbnails, and multi-platform export.

> *Turn Long Videos Into Viral Shorts in Minutes.*

## Stack

- **Frontend:** Vite 7 + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + Lucide
- **Backend (local dev):** Express + Node.js
- **Backend (production):** Vercel Serverless Functions (`/api/*`)
- **Database / Auth / Storage:** Supabase (PostgreSQL, Auth, Storage) — client wired, provisioning pending
- **Video pipeline (planned):** FFmpeg, Faster-Whisper, yt-dlp, PySceneDetect, MediaPipe, EasyOCR
- **AI providers (planned, behind adapters):** Gemini, Groq, OpenRouter

## Project structure

```
.
├── api/                          # Vercel serverless functions (production backend)
│   ├── health.js  analyze-url.js  analytics.js  history.js  projects.js
│   ├── jobs/[id]/status.js  jobs/[id]/clips.js
│   └── lib/store.js  lib/clips.js   # stateless mock data layer (MVP)
├── server/server.js              # Express dev server (local only; mirrors /api shapes)
├── supabase/migrations/001_initial_schema.sql   # initial schema (RLS on; policies in Phase 3)
├── src/
│   ├── lib/supabase.ts           # Supabase client (lazy; null until env is set)
│   ├── components/               # Dashboard, LandingPage, ui/*
│   └── utils/cn.ts
├── .env.example                  # env template (copy to .env)
└── vite.config.ts
```

## Quick start

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env
```
- `PORT` — Express port (default `3001`).
- `VITE_API_URL` — where the browser calls the API:
  - **local dev:** `http://localhost:3001/api` (the `.env.example` default)
  - **Vercel / production:** set to `/api` (relative → serverless functions) or the full origin.
    ⚠️ Do **not** leave it empty in production — the code falls back to `localhost:3001` and will fail.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — leave blank until a Supabase project exists.
  The anon key is public; the `service_role` key must **never** be in a `VITE_` var.

### 3. Run locally
```bash
npm run server     # Express on :3001  (terminal 1)
npm run dev        # Vite    on :5173  (terminal 2)
# or both at once:
npm run dev:all
```

## Backend API

Served by **Express** in local dev and by the **serverless functions** in `api/` on
Vercel. Both return identical shapes.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET  | `/api/health` | Health check |
| POST | `/api/analyze-url` | Submit a video URL for analysis |
| GET  | `/api/jobs/:jobId/status` | Processing status |
| GET  | `/api/jobs/:jobId/clips` | Generated clips |
| GET  | `/api/projects` | Project history |
| GET  | `/api/history` | Export history |
| GET  | `/api/analytics` | Analytics |

> **Serverless note:** Vercel functions are stateless, so `api/` reproduces job
> progress *deterministically* from a timestamp embedded in the `jobId` (same UX
> as the Express pipeline) instead of an in-memory `Map`. This is an MVP mock —
> real processing + persistence land with FFmpeg + Supabase.

## Lint & format
```bash
npm run lint           # ESLint over src/**/*.{ts,tsx}
npm run lint:fix       # auto-fix where possible
npm run format         # Prettier (write)
npm run format:check   # Prettier (check, CI-friendly)
```

## Deployment (Vercel)
- Framework preset: **Vite**.
- **Install Command:** `npm install` (not `npm ci`) so a stale committed
  `package-lock.json` never breaks the build on mobile workflows.
- Env: `VITE_API_URL=/api` (plus Supabase vars once provisioned).
- `api/*.js` deploy automatically as Serverless Functions.

## Next steps
- **Phase 3:** Supabase Auth + session persistence + protected routes + RLS policies.
- Wire the frontend to Supabase (replace the in-memory mock).
- Real video pipeline (yt-dlp + FFmpeg + Whisper + scene detection).
- Payments / subscriptions.
