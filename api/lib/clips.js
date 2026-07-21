// api/lib/clips.js
// ---------------------------------------------------------------------------
// Mock clip generator (MVP). Ported 1:1 from server/server.js so the Vercel
// serverless API returns the exact same clip object shapes as the Express
// dev server. Real clip generation (yt-dlp + FFmpeg + Faster-Whisper +
// PySceneDetect + MediaPipe + EasyOCR) is implemented in later phases.
// ---------------------------------------------------------------------------

export function generateMockClips(url) {
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
