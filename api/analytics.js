// api/analytics.js
// ---------------------------------------------------------------------------
// Vercel serverless — GET /api/analytics
// Response matches server.js: the analytics object is returned UNWRAPPED
// (server.js does res.json(analyticsData), not res.json({ analytics })).
// ---------------------------------------------------------------------------

import { getAnalytics } from './lib/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json(getAnalytics());
}
