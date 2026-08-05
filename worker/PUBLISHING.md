# Phase 6 publishing adapters

Status: Provider integration is Deployment Pending.

The `publish_requests` table stores user-owned publishing requests for TikTok, Instagram Reels, and YouTube Shorts. The worker adapter validates the platform and provides a provider-neutral boundary.

No social provider credentials are stored in GitHub. Real publishing requires provider OAuth, token refresh, upload APIs, rate limits, and platform-specific review. Until those are configured, requests must remain queued rather than pretending that a post was published.

Migration order: apply `014_publishing_requests.sql` after migrations `006` through `013`.