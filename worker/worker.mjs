import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { rankCandidates } from "./lib/ai-provider.mjs";
import { transcribeAudio } from "./lib/transcriber.mjs";
import { downloadSource as downloadWithAdapter } from "./lib/source-adapter.mjs";
import { promisify } from "node:util";

const exec = promisify(execFile);
const SUPABASE_URL = required("SUPABASE_URL").replace(/\/$/, "");
const SERVICE_ROLE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
const WORKER_ID = process.env.CLIPIQ_WORKER_ID || `local-${randomUUID().slice(0, 8)}`;
const BUCKET = process.env.CLIPIQ_STORAGE_BUCKET || "clipiq-media";
const POLL_INTERVAL_MS = Number(process.env.CLIPIQ_POLL_INTERVAL_MS || 3000);
const MAX_SOURCE_BYTES = Number(process.env.CLIPIQ_MAX_SOURCE_BYTES || 500_000_000);
const TRANSCRIBER_COMMAND = process.env.CLIPIQ_TRANSCRIBER_COMMAND || "";
const OUTPUT_DIR = process.env.CLIPIQ_OUTPUT_DIR || join(process.cwd(), "worker-output");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function headers(extra = {}) {
  return { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, ...extra };
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: headers({ "Content-Type": "application/json", ...(options.headers || {}) }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function recoverStaleJobs() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/recover_stale_clipiq_jobs`, {
    method: "POST", headers: headers(), body: "{}",
  });
  if (!response.ok) throw new Error(`Stale-job recovery failed (${response.status}): ${await response.text()}`);
  return response.json();
}

async function claimJob() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_next_clipiq_job`, {
    method: "POST", headers: headers(), body: JSON.stringify({ p_worker_id: WORKER_ID }),
  });
  if (!response.ok) throw new Error(`Job claim failed (${response.status}): ${await response.text()}`);
  const jobs = await response.json();
  return jobs?.[0] || null;
}

async function notifyUser(userId, title, detail) {
  await supabase("notifications", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: userId, title, detail }),
  });
}

async function updateJob(id, update, notify = false) {
  await supabase(`jobs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...update, worker_id: WORKER_ID, locked_at: update.locked_at ?? new Date().toISOString() }),
  });
  if (notify && currentJob) await notifyUser(currentJob.user_id, "ClipIQ processing update", update.message);
}

async function downloadSource(url, directory) {
  return downloadWithAdapter(url, directory, (update) => updateJob(currentJob.id, update, true), MAX_SOURCE_BYTES);
}

async function mediaInfo(input) {
  const { stdout } = await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", input]);
  const duration = Number(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Could not read source duration");
  return duration;
}

async function extractAudio(input, directory) {
  await updateJob(currentJob.id, { status: "extracting_audio", stage: "extracting_audio", progress: 35, message: "Extracting audio..." }, true);
  const audio = join(directory, "audio.wav");
  await exec("ffmpeg", ["-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000", audio]);
  return audio;
}

async function transcribe(audio, directory) {
  await updateJob(currentJob.id, { status: "transcribing", stage: "transcribing", progress: 50, message: "Generating transcript..." }, true);
  const transcript = await transcribeAudio(audio);
  await writeFile(join(directory, "transcript.txt"), transcript);
  return transcript;
}

async function selectCandidates(duration, transcript) {
  const clipLength = Math.min(45, Math.max(20, duration / 4));
  const count = Math.min(4, Math.max(1, Math.floor(duration / clipLength)));
  const candidates = Array.from({ length: count }, (_, index) => ({
    start: Math.max(0, Math.round(index * clipLength)),
    duration: Math.min(clipLength, Math.max(1, duration - index * clipLength)),
    title: `Local candidate ${index + 1}`,
    hook: transcript.slice(0, 120) || "A promising moment from your video",
    score: 60 + index * 7,
  }));
  return rankCandidates({ transcript, candidates });
}

async function renderCandidates(input, candidates, directory) {
  await updateJob(currentJob.id, { status: "generating_clips", stage: "generating_clips", progress: 75, message: "Rendering candidate clips..." }, true);
  const rendered = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const file = join(directory, `clip-${index + 1}.mp4`);
    await exec("ffmpeg", ["-y", "-ss", String(candidate.start), "-i", input, "-t", String(candidate.duration), "-vf", "scale=1080:-2", "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart", file]);
    rendered.push({ ...candidate, file });
  }
  return rendered;
}

async function upload(file, storagePath) {
  const body = await readFile(file);
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST", headers: headers({ "Content-Type": "video/mp4", "x-upsert": "true" }), body,
  });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status}): ${await response.text()}`);
  return storagePath;
}

async function saveResults(job, rendered) {
  const rows = [];
  for (const clip of rendered) {
    const storagePath = `${job.user_id}/${job.id}/${basename(clip.file)}`;
    await upload(clip.file, storagePath);
    rows.push({ user_id: job.user_id, job_id: job.id, title: clip.title, hook: clip.hook, duration: `${Math.round(clip.duration)}s`, virality_score: clip.score, video_url: storagePath, status: "ready", captions: [], hashtags: [], platforms: ["TikTok", "Instagram", "YouTube"] });
  }
  await supabase("clips", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(rows) });
  await supabase(`projects?id=eq.${encodeURIComponent(job.project_id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "completed", clip_count: rows.length }) });
  await updateJob(job.id, { status: "completed", stage: "completed", progress: 100, message: "Analysis complete!", completed_at: new Date().toISOString(), error: null, locked_at: null });
  await notifyUser(job.user_id, "Analysis complete", "Your ClipIQ candidate clips are ready to review.");
}

function classifyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (/invalid|unsupported|size limit|url is required|not found|401|403/.test(lower)) return { code: "INPUT_INVALID", retryable: false, message };
  if (/gemini|groq|openrouter|rate|429|timeout|network|fetch failed|storage|supabase|econn|ffmpeg|ffprobe/.test(lower)) return { code: "TRANSIENT_PROCESSING", retryable: true, message };
  if (/transcrib|whisper/.test(lower)) return { code: "TRANSCRIPTION_FAILED", retryable: false, message };
  return { code: "PROCESSING_FAILED", retryable: true, message };
}

async function processJob(job) {
  const directory = await mkdtemp(join(tmpdir(), "clipiq-"));
  currentJob = job;
  try {
    const input = await downloadSource(job.source_url, directory);
    const duration = await mediaInfo(input);
    const audio = await extractAudio(input, directory);
    const transcript = await transcribe(audio, directory);
    await updateJob(job.id, { status: "analyzing", stage: "analyzing", progress: 65, message: "Selecting clip candidates..." }, true);
    const candidates = await selectCandidates(duration, transcript);
    const rendered = await renderCandidates(input, candidates, directory);
    await saveResults(job, rendered);
    console.log(`[${WORKER_ID}] completed ${job.id}`);
  } catch (error) {
    const classified = classifyError(error);
    const attempts = Number(job.processing_attempts || 1);
    const maxAttempts = Number(job.max_attempts || 3);
    const retryable = classified.retryable && attempts < maxAttempts;
    const status = retryable ? "queued" : "dead_letter";
    const stage = retryable ? "queued" : "dead_letter";
    await supabase(`jobs?id=eq.${encodeURIComponent(job.id)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status, stage, progress: retryable ? 0 : job.progress, message: retryable ? `Retry scheduled (${attempts}/${maxAttempts})` : `Dead letter: ${classified.message}`, error: classified.message, last_error_code: classified.code, dead_lettered_at: retryable ? null : new Date().toISOString(), worker_id: WORKER_ID, locked_at: null, timeout_at: null }),
    });
    if (!retryable) {
      await supabase(`projects?id=eq.${encodeURIComponent(job.project_id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "failed" }) });
    }
    await notifyUser(job.user_id, retryable ? "Analysis will retry" : "Analysis moved to review", retryable ? `${classified.code}: retry ${attempts}/${maxAttempts}` : `${classified.code}: ${classified.message}`);
    console.error(`[${WORKER_ID}] ${status} ${job.id}: ${classified.code} ${classified.message}`);
  } finally {
    currentJob = null;
    await rm(directory, { recursive: true, force: true });
  }
}

let currentJob = null;
console.log(`[${WORKER_ID}] ClipIQ Phase 5 worker listening`);
while (true) {
  try {
    await recoverStaleJobs();
    const job = await claimJob();
    if (job) await processJob(job);
    else await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  } catch (error) {
    console.error(`[${WORKER_ID}] loop error:`, error instanceof Error ? error.message : error);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
