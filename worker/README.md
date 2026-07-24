# ClipIQ Phase 5 local worker

This worker is the first local-first Phase 5 vertical slice. It consumes authenticated jobs from `public.jobs`, runs media processing outside Vercel, uploads rendered MP4 candidates to the private Supabase `clipiq-media` bucket, writes `public.clips`, and updates job/project status.

## What it does now

- Claims one queued job through the service-role-only `claim_next_clipiq_job` RPC.
- Downloads a direct media URL with a configurable size limit.
- Uses `ffprobe` to read duration.
- Uses `ffmpeg` to extract mono 16 kHz audio.
- Provides a transcription adapter boundary through `CLIPIQ_TRANSCRIBER_COMMAND`.
- Uses an honest local transcript fallback when no transcriber is configured.
- Selects deterministic local candidates as a no-cost fallback.
- Renders candidate MP4 clips with FFmpeg.
- Uploads outputs to private Supabase Storage.
- Saves clip metadata and updates projects/jobs, including failures.

The fallback is deliberately not described as AI transcription or AI clip selection. Faster-Whisper and the AI provider adapter are the next provider-specific integrations after the local worker contract is verified.

## Prerequisites

- Node.js 22+
- FFmpeg and FFprobe available on PATH, or use the included Dockerfile.
- A Supabase project with migrations 001 through 006 applied.
- A server-only Supabase service-role key. Never use it in `VITE_*` variables or the browser.
- A direct media URL for the first local test. yt-dlp support is not enabled by default.

## Local run

From the repository root:

```bash
cp worker/.env.example .env.worker
# edit .env.worker with server-only values
set -a && . ./.env.worker && set +a
node worker/worker.mjs
```

The worker polls every three seconds. It processes the oldest queued job and then returns to the queue.

## Docker run

```bash
docker build -f worker/Dockerfile -t clipiq-worker .
docker run --rm --env-file .env.worker clipiq-worker
```

## Important verification boundary

The repository can verify the worker source and syntax. The agent cannot verify your private Supabase migration, Storage bucket, service-role permissions, actual source download, or authenticated end-to-end result without owner-run evidence.

## Security notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` only on the worker host.
- Keep the storage bucket private.
- Generated `video_url` values are storage paths, not public URLs. A later export/download batch should convert them to short-lived signed URLs.
- Add source-domain allowlists, stronger media validation, retries, and quotas before public production use.
