// api/health.js
// ---------------------------------------------------------------------------
// Vercel serverless health check — GET /api/health
// Response shape matches server/server.js: { status: 'ok', timestamp }
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
