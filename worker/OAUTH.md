# Provider OAuth preparation

Status: Deployment Pending.

The current connection route starts YouTube OAuth only when server-side configuration exists. Instagram and TikTok return an honest pending response until their provider-specific flows are implemented.

Required server-side variables for YouTube:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OAUTH_STATE_SECRET
YOUTUBE_CLIENT_ID
YOUTUBE_REDIRECT_URI
```

The browser receives only an authorization URL. Provider secrets and tokens must remain server-side. Token exchange and encrypted token storage are intentionally deployment work and are not claimed as live.
