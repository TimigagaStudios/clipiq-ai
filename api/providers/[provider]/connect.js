// Vercel serverless — GET /api/providers/:provider/connect
// Starts a provider OAuth flow when server-side OAuth variables are configured.

import { createHmac, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const providers = new Set(['youtube', 'instagram', 'tiktok']);

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const provider = String(req.query.provider || '').toLowerCase();
  if (!providers.has(provider)) return res.status(400).json({ error: 'Unsupported provider.' });

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication is required.' });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  if (!supabaseUrl || !serviceRoleKey || !stateSecret) return res.status(503).json({ error: 'OAuth deployment is not configured yet.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid session.' });

  if (req.method === 'POST' && req.query.action === 'disconnect') {
    const { error: secretError } = await admin.from('provider_secrets').delete().eq('user_id', data.user.id).eq('provider', provider);
    if (secretError) return res.status(500).json({ error: secretError.message });
    const { error: connectionError } = await admin.from('provider_connections').update({ status: 'disconnected', last_error: null, token_expires_at: null, updated_at: new Date().toISOString() }).eq('user_id', data.user.id).eq('provider', provider);
    if (connectionError) return res.status(500).json({ error: connectionError.message });
    return res.status(200).json({ provider, status: 'disconnected' });
  }

  if (req.method !== 'GET') return res.status(400).json({ error: 'Unsupported connection action.' });
  if (provider !== 'youtube') return res.status(501).json({ error: `${provider} OAuth is prepared but its provider integration is still pending.` });
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;
  if (!clientId || !redirectUri) return res.status(503).json({ error: 'YouTube OAuth is not configured yet.' });

  const nonce = randomBytes(18).toString('hex');
  const payload = `${data.user.id}:${provider}:${nonce}`;
  const signature = createHmac('sha256', stateSecret).update(payload).digest('hex');
  const state = Buffer.from(`${payload}:${signature}`).toString('base64url');
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly', state });
  return res.status(200).json({ provider, authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}
