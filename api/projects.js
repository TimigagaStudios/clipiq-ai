// api/projects.js
// ---------------------------------------------------------------------------
// Vercel serverless — GET /api/projects
// Response matches server.js: { projects }
// ---------------------------------------------------------------------------

import { getProjects } from './lib/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ projects: getProjects() });
}
