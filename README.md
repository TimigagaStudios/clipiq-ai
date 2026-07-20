# ClipIQ AI

AI-powered SaaS that turns long videos into viral short-form clips.

## Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4
- **Backend:** Express + Node.js
- **Storage:** In-memory (MVP) — will be replaced with Supabase later

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a different port.

### 3. Start the backend

```bash
npm run server
```

Backend will run on `http://localhost:3001`.

### 4. Start the frontend

In a new terminal:

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`.

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/analyze-url` | Submit a YouTube/video URL for analysis |
| GET | `/api/jobs/:jobId/status` | Get processing status |
| GET | `/api/jobs/:jobId/clips` | Get generated clips |
| GET | `/api/projects` | Get project history |
| GET | `/api/history` | Get export history |
| GET | `/api/analytics` | Get analytics data |

## Next Steps

- Replace in-memory storage with Supabase
- Add real video processing with FFmpeg + yt-dlp
- Add authentication
- Add subscription/payment integration
