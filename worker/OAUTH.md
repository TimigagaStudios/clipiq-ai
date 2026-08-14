# Provider OAuth preparation

Status: Deployment Pending.

The connection route starts YouTube or Instagram OAuth only when server-side configuration exists. TikTok remains pending until its provider-specific flow is implemented.

Required server-side variables for YouTube:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OAUTH_STATE_SECRET
YOUTUBE_CLIENT_ID
YOUTUBE_REDIRECT_URI
YOUTUBE_CLIENT_SECRET
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI
OAUTH_TOKEN_ENCRYPTION_KEY
APP_URL
```

The browser receives only an authorization URL. The callback verifies signed state, exchanges the YouTube code, and encrypts tokens with AES-256-GCM before server-side storage. Provider secrets and encryption keys remain server-side. Live OAuth execution and provider verification are still Deployment Pending.
