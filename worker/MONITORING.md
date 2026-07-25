# ClipIQ operational monitoring

Status: Deployment Pending.

## Health endpoint

`GET /api/queue/health` returns queue counts and worker freshness. Protect it with `QUEUE_HEALTH_TOKEN` and send that value in the `x-queue-health-token` header.

Important fields:

- `queued`: jobs waiting
- `active`: jobs currently processing
- `dead_letter`: jobs requiring review
- `workers_online`: workers seen in the last two minutes
- `workers_stale`: workers that stopped sending heartbeats
- `oldest_queued_at`: queue waiting-age signal

## Suggested alerts

Start with these operational thresholds:

- Alert if `workers_online` is zero while `queued` is greater than zero.
- Alert if `workers_stale` is greater than zero for more than five minutes.
- Alert if `dead_letter` increases.
- Alert if the oldest queued job is older than 15 minutes.
- Alert if failed jobs increase repeatedly over a short period.
- Alert if Storage upload failures appear in job audit events.

## Storage cleanup

The worker always removes its temporary processing directory in the `finally` cleanup path. Supabase Storage outputs are intentionally not automatically deleted by this batch. A later retention job should remove orphaned outputs only after checking that no export or clip record references them.

## Cloud setup

Add the following server-side variables to the Vercel/API environment or worker host as appropriate:

```text
QUEUE_HEALTH_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLIPIQ_STORAGE_BUCKET
```

Never expose these through `VITE_*` variables.
