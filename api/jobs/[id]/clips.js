// api/jobs/[id]/clips.js
// ---------------------------------------------------------------------------
// Vercel serverless — GET /api/jobs/:jobId/clips
//
// Vercel filesystem routing exposes the [id] segment via req.query.id.
// Response shape matches server.js: { jobId, status, progress, clips }
// Clips are [] until the (derived) state reaches `completed`.
// ---------------------------------------------------------------------------

import { getJobClips } from '../../lib/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Job id is required' });
  }

  return res.status(200).json(getJobClips(id));
}
