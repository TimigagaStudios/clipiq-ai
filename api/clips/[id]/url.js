// Vercel serverless — GET /api/clips/:id/url
// Returns a short-lived signed URL for a user-owned rendered clip.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.CLIPIQ_STORAGE_BUCKET || 'clipiq-media';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: 'Storage signing is not configured.' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const clipId = req.query.id;
  if (!token || !clipId) return res.status(401).json({ error: 'Authentication and clip id are required.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return res.status(401).json({ error: 'Invalid session.' });

  const { data: clip, error: clipError } = await admin.from('clips')
    .select('video_url')
    .eq('id', clipId)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (clipError) return res.status(500).json({ error: clipError.message });
  if (!clip?.video_url) return res.status(404).json({ error: 'Rendered clip not found.' });

  const { data: signed, error: signError } = await admin.storage.from(bucket).createSignedUrl(clip.video_url, 3600);
  if (signError) return res.status(500).json({ error: signError.message });
  return res.status(200).json({ url: signed.signedUrl, expiresIn: 3600 });
}
