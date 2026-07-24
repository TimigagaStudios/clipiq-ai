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
