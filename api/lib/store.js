// api/lib/store.js
// ---------------------------------------------------------------------------
// Stateless data layer for the Vercel serverless API (MVP / mock).
//
// WHY STATELESS (read this before "fixing" it with a Map):
// server/server.js keeps jobs in a process-wide Map + setTimeout pipeline.
// That works because Express is one long-lived process. Vercel functions are
// STATELESS: memory is not shared between requests, and /api/analyze-url and
// /api/jobs/[id]/status execute in DIFFERENT function instances, so a Map
// created in analyze-url is invisible to the status call.
//
// To reproduce the SAME external behaviour + JSON shapes as server.js without
// shared state, the jobId embeds its creation timestamp (format
// `job-<ms>-<rand>`, identical to server.js) and the status/clips endpoints
// derive the staged processing progress from elapsed time. Every cold or warm
// invocation therefore shows the same downloading -> ... -> completed
// timeline. The seed read-data below is copied verbatim from server.js.
//
// This entire layer is a MOCK. It is replaced by Supabase (PostgreSQL) in the
// database phase. Do NOT treat it as durable storage.
// ---------------------------------------------------------------------------

import { generateMockClips } from './clips.js';

// ---- Seed (read-only) mock data â copied verbatim from server/server.js ----

const projects = [
  {
    id: 1,
    title: 'Impact of AI on Modern SaaS Design 1',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    clipCount: 4,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 2,
    title: 'Impact of AI on Modern SaaS Design 2',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617475-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    clipCount: 6,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];

const historyItems = [
  {
    id: 'clip-001',
    title: 'Clip #001: The Power of AI Automation',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
  {
    id: 'clip-002',
    title: 'Clip #002: Building a $100M SaaS',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617475-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
  {
    id: 'clip-003',
    title: 'Clip #003: The Future of Work',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617476-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
  {
    id: 'clip-004',
    title: 'Clip #004: AI Workflow Revolution',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617477-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
];

const analyticsData = {
  chartData: [40, 60, 45, 90, 65, 80, 55, 70, 85, 40, 50, 75],
  topClips: [
    { title: 'How to build a $100M SaaS', views: '24.5k', engagement: '12%', change: '+4.2%' },
    { title: 'The Future of AI Content', views: '18.2k', engagement: '9.5%', change: '+2.8%' },
    { title: 'Workflow Automation Tips', views: '12.1k', engagement: '8.1%', change: '+1.9%' },
  ],
  platformDistribution: [
    { platform: 'TikTok', val: 65, color: 'bg-pink-500' },
    { platform: 'Instagram', val: 25, color: 'bg-purple-500' },
    { platform: 'YouTube', val: 10, color: 'bg-red-500' },
  ],
};

// ---- Processing timeline (mirrors the stages array in server/server.js) ----
// Each `at` is the cumulative ms after creation at which the job enters that
// stage. Identical numbers to server.js so the UX timing matches.
const STAGES = [
  { at: 1200, status: 'downloading', progress: 15, message: 'Downloading video...' },
  { at: 2700, status: 'extracting_audio', progress: 30, message: 'Extracting audio...' },
  { at: 4700, status: 'transcribing', progress: 50, message: 'Generating transcript...' },
  { at: 6700, status: 'analyzing', progress: 75, message: 'AI is identifying viral hooks...' },
  { at: 8200, status: 'generating_clips', progress: 90, message: 'Generating clips...' },
  { at: 9000, status: 'completed', progress: 100, message: 'Analysis complete!' },
];
const TOTAL_MS = 9000;
const INITIAL = { status: 'queued', progress: 0, message: 'Queued for processing' };

function makeJobId() {
  return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseCreatedAt(jobId) {
  const m = typeof jobId === 'string' && jobId.match(/^job-(\d+)-/);
  return m ? Number(m[1]) : null;
}

// Last stage whose boundary has been passed; before the first boundary the
// job is still in its INITIAL (queued) state.
function stateForElapsed(elapsedMs) {
  let current = INITIAL;
  for (const stage of STAGES) {
    if (elapsedMs >= stage.at) current = stage;
    else break;
  }
  return current;
}

// ---- Public API (used by the route handlers) ----

export function getProjects() {
  return projects;
}

export function getHistory() {
  return historyItems;
}

export function getAnalytics() {
  return analyticsData;
}

// Mirrors the 201 body returned by server.js POST /api/analyze-url.
export function createJob({ url, category = 'auto' } = {}) {
  const jobId = makeJobId();
  return {
    jobId,
    status: INITIAL.status,
    progress: INITIAL.progress,
    message: INITIAL.message,
    // category is returned for caller convenience; not part of server.js body,
    // kept additive (never removes fields the frontend may rely on).
    category,
    url,
  };
}

// Mirrors server.js GET /api/jobs/:jobId/status shape:
//   { jobId, status, progress, message, url, category, createdAt }
// Divergence: server.js returns 404 for unknown ids; here an unparseable id
// yields a synthesized completed job so the live UI never dead-ends on Vercel.
export function getJobStatus(jobId) {
  const createdAt = parseCreatedAt(jobId);
  if (createdAt == null) {
    return {
      jobId,
      status: 'completed',
      progress: 100,
      message: 'Analysis complete!',
      url: '',
      category: 'auto',
      createdAt: new Date().toISOString(),
    };
  }
  const state = stateForElapsed(Date.now() - createdAt);
  return {
    jobId,
    status: state.status,
    progress: state.progress,
    message: state.message,
    url: '',
    category: 'auto',
    createdAt: new Date(createdAt).toISOString(),
  };
}

// Mirrors server.js GET /api/jobs/:jobId/clips shape:
//   { jobId, status, progress, clips }
// clips stay [] until the derived state reaches `completed`, exactly like the
// Express server (which only fills job.clips on completion).
export function getJobClips(jobId) {
  const createdAt = parseCreatedAt(jobId);
  let status = 'completed';
  let progress = 100;
  if (createdAt != null) {
    const state = stateForElapsed(Date.now() - createdAt);
    status = state.status;
    progress = state.progress;
  }
  const completed = status === 'completed';
  return {
    jobId,
    status,
    progress,
    clips: completed ? generateMockClips('') : [],
  };
}

export const __internal = { STAGES, TOTAL_MS, parseCreatedAt, stateForElapsed };
