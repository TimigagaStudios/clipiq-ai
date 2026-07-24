import { getSupabase } from "./supabase";

export type DashboardProject = {
  id: string;
  title: string;
  thumbnail: string | null;
  clipCount: number;
  status: string;
  createdAt: string;
};

export type DashboardHistoryItem = {
  id: string;
  title: string;
  thumbnail: string | null;
  format: string;
  resolution: string;
  platform: string | null;
  clipId: string | null;
  exportedAt: string;
};

export type DashboardAnalytics = {
  chartData: number[];
  topClips: { title: string; views: string; engagement: string; change: string }[];
  platformDistribution: { platform: string; val: number; color: string }[];
  estimatedViews: string;
  timeSaved: string;
};

export type DashboardClip = {
  id: string;
  title: string;
  hook: string | null;
  duration: string | null;
  viralityScore: number | null;
  thumbnail: string | null;
  videoUrl: string | null;
};

type ClipRow = {
  id: string;
  title: string;
  hook: string | null;
  duration: string | null;
  virality_score: number | null;
  created_at: string;
  thumbnail: string | null;
  video_url: string | null;
};

type ExportRow = {
  id: string;
  title: string;
  thumbnail: string | null;
  format: string;
  resolution: string;
  platform: string | null;
  exported_at: string;
};

const platformColors: Record<string, string> = {
  TikTok: "bg-pink-500",
  Instagram: "bg-purple-500",
  YouTube: "bg-red-500",
  Podcast: "bg-cyan-500",
  Other: "bg-white/40",
};

function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

function deriveAnalytics(clips: ClipRow[], exportsRows: ExportRow[]): DashboardAnalytics {
  const chartData = Array.from({ length: 12 }, (_, index) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (11 - index));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = [...clips.map((clip) => clip.created_at), ...exportsRows.map((item) => item.exported_at)]
      .filter((date) => new Date(date) >= dayStart && new Date(date) < dayEnd).length;
    return count;
  });

  const sorted = [...clips].sort((a, b) => (b.virality_score ?? 0) - (a.virality_score ?? 0)).slice(0, 3);
  const topClips = sorted.map((clip) => {
    const score = clip.virality_score ?? 0;
    return {
      title: clip.title,
      views: formatCompact(score * 250),
      engagement: `${Math.max(1, Math.round(score / 10))}%`,
      change: score ? `+${Math.max(1, Math.round(score / 20))}%` : "Ã¢ÂÂ",
    };
  });

  const counts = new Map<string, number>();
  exportsRows.forEach((item) => {
    const platform = item.platform || "Other";
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  });
  const totalExports = exportsRows.length;
  const platformDistribution = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([platform, count]) => ({
      platform,
      val: totalExports ? Math.round((count / totalExports) * 100) : 0,
      color: platformColors[platform] ?? platformColors.Other,
    }));

  return {
    chartData,
    topClips,
    platformDistribution,
    estimatedViews: formatCompact(clips.reduce((sum, clip) => sum + (clip.virality_score ?? 0) * 250, 0)),
    timeSaved: `${(clips.length * 0.5).toFixed(1)}h`,
  };
}

export async function loadDashboardData(userId: string) {
  const supabase = getSupabase();
  const [projectsResult, exportsResult, clipsResult] = await Promise.all([
    supabase.from("projects").select("id,title,thumbnail,clip_count,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("exports").select("id,title,thumbnail,format,resolution,platform,clip_id,exported_at").eq("user_id", userId).order("exported_at", { ascending: false }),
    supabase.from("clips").select("id,title,hook,duration,thumbnail,video_url,virality_score,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  const error = projectsResult.error || exportsResult.error || clipsResult.error;
  if (error) throw error;

  const projects: DashboardProject[] = (projectsResult.data ?? []).map((project) => ({
    id: String(project.id), title: project.title, thumbnail: project.thumbnail,
    clipCount: project.clip_count, status: project.status, createdAt: project.created_at,
  }));
  const history: DashboardHistoryItem[] = (exportsResult.data ?? []).map((item) => ({
    id: String(item.id), title: item.title, thumbnail: item.thumbnail,
    format: item.format, resolution: item.resolution, platform: item.platform,
    clipId: item.clip_id ? String(item.clip_id) : null, exportedAt: item.exported_at,
  }));
  const clipRows = (clipsResult.data ?? []) as ClipRow[];
  const clips: DashboardClip[] = clipRows.map((clip) => ({
    id: String(clip.id), title: clip.title, hook: clip.hook, duration: clip.duration,
    viralityScore: clip.virality_score, thumbnail: clip.thumbnail, videoUrl: clip.video_url,
  }));
  return {
    projects,
    history,
    clips,
    totals: { videos: projects.length, clips: clips.length, exports: history.length },
    analytics: deriveAnalytics(clipRows, (exportsResult.data ?? []) as ExportRow[]),
  };
}

export type ActiveJob = {
  id: string;
  projectId: string;
  externalJobId: string;
  status: string;
  progress: number;
  message: string;
};

export type UserJobStatus = {
  status: string;
  progress: number;
  message: string;
  error: string | null;
};

export async function loadUserJobStatus(userId: string, jobId: string): Promise<UserJobStatus | null> {
  const { data, error } = await getSupabase().from("jobs")
    .select("status,progress,message,error").eq("id", jobId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? { status: data.status, progress: data.progress, message: data.message, error: data.error } : null;
}

export async function loadUserJobClips(userId: string, jobId: string) {
  const { data, error } = await getSupabase().from("clips")
    .select("id,title,hook,duration,thumbnail,video_url,virality_score,created_at")
    .eq("job_id", jobId).eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((clip) => ({
    id: String(clip.id), title: clip.title, hook: clip.hook, duration: clip.duration,
    thumbnail: clip.thumbnail, videoUrl: clip.video_url, viralityScore: clip.virality_score,
  }));
}

export async function loadActiveJob(userId: string): Promise<ActiveJob | null> {
  const { data, error } = await getSupabase().from("jobs")
    .select("id,project_id,external_job_id,status,progress,message")
    .eq("user_id", userId)
    .in("status", ["queued", "downloading", "extracting_audio", "transcribing", "analyzing", "generating_clips"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data?.project_id || !data.external_job_id) return null;
  return { id: String(data.id), projectId: String(data.project_id), externalJobId: String(data.external_job_id), status: data.status, progress: data.progress, message: data.message };
}

export async function createUserProject(userId: string, sourceUrl: string) {
  const title = new URL(sourceUrl).hostname.replace(/^www\./, "") + " video";
  const { data, error } = await getSupabase().from("projects").insert({
    user_id: userId, title, source_url: sourceUrl, status: "processing", clip_count: 0,
  }).select("id,title,thumbnail,clip_count,status,created_at").single();
  if (error) throw error;
  return { id: String(data.id), title: data.title, thumbnail: data.thumbnail, clipCount: data.clip_count, status: data.status, createdAt: data.created_at };
}

export async function createUserJob(userId: string, projectId: string, sourceUrl: string, externalJobId: string) {
  const { data, error } = await getSupabase().from("jobs").insert({
    user_id: userId, project_id: projectId, source_url: sourceUrl, external_job_id: externalJobId,
    status: "queued", progress: 0, message: "Queued for processing",
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateUserJob(userId: string, jobId: string, update: { status: string; progress: number; message: string; error?: string | null }) {
  const { error } = await getSupabase().from("jobs").update(update).eq("id", jobId).eq("user_id", userId);
  if (error) throw error;
}

export async function completeUserJob(userId: string, projectId: string, jobId: string, mockClips: Array<Record<string, unknown>>) {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase.from("clips").delete().eq("job_id", jobId).eq("user_id", userId);
  if (deleteError) throw deleteError;
  const rows = mockClips.map((clip) => ({
    user_id: userId, job_id: jobId, title: String(clip.title ?? "Untitled clip"), hook: clip.hook ?? null,
    category: clip.category ?? null, duration: clip.duration ?? null, virality_score: clip.viralityScore ?? null,
    thumbnail: clip.thumbnail ?? null, video_url: clip.videoUrl ?? null, captions: clip.captions ?? [],
    hashtags: clip.hashtags ?? [], platforms: clip.platforms ?? [], status: "ready",
  }));
  if (rows.length) {
    const { error } = await supabase.from("clips").insert(rows);
    if (error) throw error;
  }
  const [{ error: jobError }, { error: projectError }] = await Promise.all([
    supabase.from("jobs").update({ status: "completed", progress: 100, message: "Analysis complete!", error: null, completed_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", userId),
    supabase.from("projects").update({ status: "completed", clip_count: rows.length }).eq("id", projectId).eq("user_id", userId),
  ]);
  if (jobError || projectError) throw jobError || projectError;
}

export async function failUserJob(userId: string, projectId: string, jobId: string, message: string) {
  const supabase = getSupabase();
  await Promise.all([
    supabase.from("jobs").update({ status: "failed", message, error: message }).eq("id", jobId).eq("user_id", userId),
    supabase.from("projects").update({ status: "failed" }).eq("id", projectId).eq("user_id", userId),
  ]);
}

export async function createUserExport(userId: string, clip: Record<string, unknown>, platform = "Download") {
  const clipId = typeof clip.id === "string" && /^[0-9a-f-]{36}$/i.test(clip.id) ? clip.id : null;
  const { error } = await getSupabase().from("exports").insert({
    user_id: userId, clip_id: clipId, title: String(clip.title ?? "ClipIQ export"),
    thumbnail: clip.thumbnail ?? null, format: "MP4", resolution: "1080p", platform,
  });
  if (error) throw error;
}

export async function clearUserExports(userId: string) {
  const { error } = await getSupabase().from("exports").delete().eq("user_id", userId);
  if (error) throw error;
}
