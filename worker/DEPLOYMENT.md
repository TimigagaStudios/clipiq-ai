# ClipIQ worker cloud deployment preparation

Status: Deployment Pending. No cloud service has been connected by this code batch.

## Railway preparation

The repository includes `worker/railway.toml` and `worker/Dockerfile`.
Create a Railway service from the GitHub repository with the repository root as the project root. Railway should use the Dockerfile path `worker/Dockerfile`.

Set these variables in the Railway service environment UI, never in GitHub:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLIPIQ_WORKER_ID
CLIPIQ_STORAGE_BUCKET=clipiq-media
CLIPIQ_POLL_INTERVAL_MS=3000
CLIPIQ_MAX_SOURCE_BYTES=500000000
CLIPIQ_AI_PROVIDER=heuristic
CLIPIQ_AI_MODEL
GEMINI_API_KEY
GEMINI_MODEL
GROQ_API_KEY
OPENROUTER_API_KEY
CLIPIQ_TRANSCRIBER_COMMAND
FASTER_WHISPER_COMMAND
CLIPIQ_YTDLP_COMMAND
```

Only set the provider keys and command paths that are actually available. Do not use a `VITE_*` variable for any server secret.

## Before activation

1. Apply Supabase migrations 006, 007, and 008 in order.
2. Confirm the private `clipiq-media` bucket exists.
3. Confirm the service-role key is stored only in Railway variables.
4. Confirm Vercel has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLIPIQ_STORAGE_BUCKET` for signed clip URLs.
5. Start with one worker and low source-size limits.
6. Review job, notification, retry, dead-letter, and signed-URL behavior before public processing.

Cloud activation and end-to-end verification remain Deployment Pending.
