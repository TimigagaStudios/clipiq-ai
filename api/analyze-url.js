// api/analyze-url.js
// ---------------------------------------------------------------------------
// Vercel serverless — POST /api/analyze-url
// Validates the URL and returns a jobId. Wire response matches server.js 201:
//   { jobId, status, progress, message }   (no extra fields)
// ---------------------------------------------------------------------------

import { createJob } from './lib/store.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { url, category = 'auto' } = body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const job = createJob({ url, category });

  return res
    .status(201)
    .json({ jobId: job.jobId, status: job.status, progress: job.progress, message: job.message });
}
