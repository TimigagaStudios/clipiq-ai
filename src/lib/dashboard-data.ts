// Phase 4 user-owned Dashboard data adapter.
// Supabase tables already exist from 001/002: projects, jobs, clips, exports.
import { getSupabase } from "./supabase";

export async function loadDashboardData(userId: string) {
  const supabase = getSupabase();
  const [projectsResult, exportsResult, clipsResult] = await Promise.all([
    supabase.from("projects").select("id,title,thumbnail,clip_count,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("exports").select("id,title,thumbnail,format,resolution,exported_at").eq("user_id", userId).order("exported_at", { ascending: false }),
    supabase.from("clips").select("id,virality_score,created_at").eq("user_id", userId),
  ]);
  const error = projectsResult.error || exportsResult.error || clipsResult.error;
  if (error) throw error;
  const projects = (projectsResult.data ?? []).map((p) => ({ id: p.id, title: p.title, thumbnail: p.thumbnail, clipCount: p.clip_count, status: p.status, createdAt: p.created_at }));
  const history = (exportsResult.data ?? []).map((e) => ({ id: e.id, title: e.title, thumbnail: e.thumbnail, format: e.format, resolution: e.resolution, exportedAt: e.exported_at }));
  const clips = clipsResult.data ?? [];
  return { projects, history, totals: { videos: projects.length, clips: clips.length, exports: history.length } };
}

export async function createUserProject(userId: string, sourceUrl: string) {
  const title = new URL(sourceUrl).hostname.replace(/^www\./, "") + " video";
  const { data, error } = await getSupabase().from("projects").insert({ user_id: userId, title, source_url: sourceUrl, status: "pending", clip_count: 0 }).select("id,title,thumbnail,clip_count,status,created_at").single();
  if (error) throw error;
  return { id: data.id, title: data.title, thumbnail: data.thumbnail, clipCount: data.clip_count, status: data.status, createdAt: data.created_at };
}

export async function createUserJob(userId: string, projectId: string, sourceUrl: string, externalJobId: string) {
  const { data, error } = await getSupabase().from("jobs").insert({ user_id: userId, project_id: projectId, source_url: sourceUrl, external_job_id: externalJobId, status: "queued", progress: 0, message: "Queued for processing" }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function completeUserJob(userId: string, projectId: string, jobId: string, mockClips: any[]) {
  const supabase = getSupabase();
  const rows = mockClips.map((clip) => ({ user_id: userId, job_id: jobId, title: clip.title, hook: clip.hook ?? null, category: clip.category ?? null, duration: clip.duration ?? null, virality_score: clip.viralityScore ?? null, thumbnail: clip.thumbnail ?? null, status: "ready" }));
  if (rows.length) { const { error } = await supabase.from("clips").insert(rows); if (error) throw error; }
  const [{ error: jobError }, { error: projectError }] = await Promise.all([
    supabase.from("jobs").update({ status: "completed", progress: 100, message: "Analysis complete!", completed_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", userId),
    supabase.from("projects").update({ status: "completed", clip_count: rows.length }).eq("id", projectId).eq("user_id", userId),
  ]);
  if (jobError || projectError) throw jobError || projectError;
}
