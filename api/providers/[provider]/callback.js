// Vercel serverless — GET /api/providers/:provider/callback
// YouTube OAuth callback with signed-state verification and encrypted secret storage.

import { createCipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function redirect(res, params) {
  const base = process.env.APP_URL || 'http://localhost:5173';
  const query = new URLSearchParams(params).toString();
  return res.redirect(`${base}/?${query}`);
}

function decryptableKey() {
  const value = process.env.OAUTH_TOKEN_ENCRYPTION_KEY || '';
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY must be 32-byte hex.');
  return Buffer.from(value, 'hex');
}

function verifyState(encoded, secret) {
  const raw = Buffer.from(encoded, 'base64url').toString('utf8');
  const [userId, provider, nonce, signature] = raw.split(':');
  if (!userId || !provider || !nonce || !signature) throw new Error('Invalid OAuth state.');
  const payload = `${userId}:${provider}:${nonce}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('OAuth state verification failed.');
  return { userId, provider };
}

function encrypt(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return { value: encrypted.toString('base64url'), iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url') };
}

export default async function handler(req, res) {
  const provider = String(req.query.provider || '').toLowerCase();
  if (req.method !== 'GET' || provider !== 'youtube') return redirect(res, { provider, connected: '0', error: 'Unsupported provider callback.' });
  if (req.query.error) return redirect(res, { provider, connected: '0', error: String(req.query.error) });

  try {
    if (!process.env.OAUTH_STATE_SECRET) throw new Error('OAUTH_STATE_SECRET is not configured.');
    const state = verifyState(String(req.query.state || ''), process.env.OAUTH_STATE_SECRET);
    const code = String(req.query.code || '');
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!code || !url || !serviceRoleKey || !process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REDIRECT_URI) throw new Error('YouTube OAuth server configuration is incomplete.');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: process.env.YOUTUBE_CLIENT_ID, client_secret: process.env.YOUTUBE_CLIENT_SECRET, redirect_uri: process.env.YOUTUBE_REDIRECT_URI, grant_type: 'authorization_code' }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error(tokens.error_description || 'YouTube token exchange failed.');

    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const channelBody = await channelResponse.json();
    const accountName = channelBody.items?.[0]?.snippet?.title || null;

    const key = decryptableKey();
    const access = encrypt(tokens.access_token, key);
    const refresh = tokens.refresh_token ? encrypt(tokens.refresh_token, key) : null;
    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await admin.from('provider_secrets').upsert({ user_id: state.userId, provider: 'youtube', encrypted_access_token: access.value, encrypted_refresh_token: refresh?.value || null, encryption_iv: access.iv, encryption_tag: access.tag, refresh_encryption_iv: refresh?.iv || null, refresh_encryption_tag: refresh?.tag || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,provider' });
    if (error) throw error;
    const { error: connectionError } = await admin.from('provider_connections').upsert({ user_id: state.userId, provider: 'youtube', status: 'connected', provider_account_name: accountName, scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'], token_expires_at: tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : null, last_error: null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,provider' });
    if (connectionError) throw connectionError;
    return redirect(res, { provider: 'youtube', connected: '1' });
  } catch (error) {
    return redirect(res, { provider: 'youtube', connected: '0', error: error instanceof Error ? error.message : 'OAuth callback failed.' });
  }
}
