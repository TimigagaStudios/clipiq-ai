// api/health.js
// GET /api/health — public app health check.
// GET /api/health?queue=1 — protected operational queue health.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.query.queue === '1') {
    const expected = process.env.QUEUE_HEALTH_TOKEN;
    if (!expected || req.headers['x-queue-health-token'] !== expected) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return res.status(503).json({ error: 'Queue health is not configured.' });
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.rpc('get_clipiq_queue_health');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
