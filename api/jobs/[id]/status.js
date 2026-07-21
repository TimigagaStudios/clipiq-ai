// api/jobs/[id]/status.js
// ---------------------------------------------------------------------------
// Vercel serverless — GET /api/jobs/:jobId/status
//
// Vercel filesystem routing exposes the [id] segment via req.query.id
// (NOT req.params like Express). Response shape matches server.js:
//   { jobId, status, progress, message, url, category, createdAt }
//
// Divergence from server.js: server.js returns 404 for unknown ids; the
// serverless store instead synthesizes a completed job so the live UI never
// dead-ends. See api/lib/store.js for the rationale.
// ---------------------------------------------------------------------------

import { getJobStatus } from '../../lib/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Job id is required' });
  }

  return res.status(200).json(getJobStatus(id));
}
