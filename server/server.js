import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage for MVP
const jobs = new Map();
const projects = [
  {
    id: 1,
    title: 'Impact of AI on Modern SaaS Design 1',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    clipCount: 4,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 2,
    title: 'Impact of AI on Modern SaaS Design 2',
    thumbnail: 'https://images.unsplash.com/photo-1611162617475-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    clipCount: 6,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];

const historyItems = [
  {
    id: 'clip-001',
    title: 'Clip #001: The Power of AI Automation',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
  {
    id: 'clip-002',
    title: 'Clip #002: Building a $100M SaaS',
    thumbnail: 'https://images.unsplash.com/photo-1611162617475-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
  {
    id: 'clip-003',
    title: 'Clip #003: The Future of Work',
    thumbnail: 'https://images.unsplash.com/photo-1611162617476-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
  {
    id: 'clip-004',
    title: 'Clip #004: AI Workflow Revolution',
    thumbnail: 'https://images.unsplash.com/photo-1611162617477-5b21e879e113?auto=format&fit=crop&q=80&w=400',
    exportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    format: 'MP4',
    resolution: '1080p',
  },
];

// Mock analytics data
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start a new analysis job
app.post('/api/analyze-url', (req, res) => {
  const { url, category = 'auto' } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const job = {
    id: jobId,
    url,
    category,
    status: 'queued',
    progress: 0,
    message: 'Queued for processing',
    createdAt: new Date().toISOString(),
    clips: [],
  };

  jobs.set(jobId, job);

  // Simulate processing pipeline
  const stages = [
    { status: 'downloading', progress: 15, message: 'Downloading video...', delay: 1200 },
    { status: 'extracting_audio', progress: 30, message: 'Extracting audio...', delay: 1500 },
    { status: 'transcribing', progress: 50, message: 'Generating transcript...', delay: 2000 },
    { status: 'analyzing', progress: 75, message: 'AI is identifying viral hooks...', delay: 2000 },
    { status: 'generating_clips', progress: 90, message: 'Generating clips...', delay: 1500 },
    { status: 'completed', progress: 100, message: 'Analysis complete!', delay: 800 },
  ];

  let stageIndex = 0;
  const runStage = () => {
    if (stageIndex >= stages.length) return;
    const stage = stages[stageIndex];
    setTimeout(() => {
      job.status = stage.status;
      job.progress = stage.progress;
      job.message = stage.message;
      stageIndex++;
      if (job.status === 'completed') {
        job.clips = generateMockClips(job.url);
      }
      runStage();
    }, stage.delay);
  };

  runStage();

  res.status(201).json({ jobId, status: job.status, progress: job.progress, message: job.message });
});

// Get job status
app.get('/api/jobs/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    url: job.url,
    category: job.category,
    createdAt: job.createdAt,
  });
});

// Get generated clips for a job
app.get('/api/jobs/:jobId/clips', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    clips: job.clips,
  });
});

// Get all projects
app.get('/api/projects', (req, res) => {
  res.json({ projects });
});

// Get export history
app.get('/api/history', (req, res) => {
  res.json({ history: historyItems });
});

// Get analytics
app.get('/api/analytics', (req, res) => {
  res.json(analyticsData);
});

function generateMockClips(url) {
  const categories = ['Hook', 'Story', 'Insight', 'CTA'];
  const hooks = [
    'This one insight changed everything...',
    'The mistake most creators make',
    'What nobody tells you about scaling',
    'This is the future of content',
  ];

  return Array.from({ length: 4 }, (_, i) => ({
    id: `clip-${Date.now()}-${i}`,
    title: `Viral Clip ${i + 1}`,
    hook: hooks[i % hooks.length],
    category: categories[i % categories.length],
    duration: `${30 + i * 15}s`,
    viralityScore: 78 + i * 4,
    thumbnail: `https://images.unsplash.com/photo-${1611162617474 + i}-5b21e879e113?auto=format&fit=crop&q=80&w=800`,
    videoUrl: url,
    captions: [
      'I think the most important thing is...',
      'to focus on the user experience.',
      'Because at the end of the day...',
    ],
    hashtags: ['#ai', '#contentcreation', '#viral', '#shorts'],
    platforms: ['TikTok', 'Instagram', 'YouTube'],
    status: 'ready',
  }));
}

app.listen(PORT, () => {
  console.log(`Ã°ÂÂÂ ClipIQ AI backend running on http://localhost:${PORT}`);
});
