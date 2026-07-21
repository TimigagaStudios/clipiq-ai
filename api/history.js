// api/history.js
// ---------------------------------------------------------------------------
// Vercel serverless — GET /api/history
// Response matches server.js: { history }
// ---------------------------------------------------------------------------

import { getHistory } from './lib/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ history: getHistory() });
}