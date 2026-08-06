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
YOUTUBE_CLIENT_SECRET
OAUTH_TOKEN_ENCRYPTION_KEY
APP_URL
```

The browser receives only an authorization URL. The callback verifies signed state, exchanges the YouTube code, and encrypts tokens with AES-256-GCM before server-side storage. Provider secrets and encryption keys remain server-side. Live OAuth execution and provider verification are still Deployment Pending.
