import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function downloadSource(url, directory, update, maxBytes) {
  const output = join(directory, "source-video");
  const ytdlp = process.env.CLIPIQ_YTDLP_COMMAND || process.env.YTDLP_COMMAND;
  if (ytdlp && /youtube\.com|youtu\.be|vimeo\.com/i.test(url)) {
    await update({ status: "downloading", stage: "downloading", progress: 20, message: "Downloading source with yt-dlp..." });
    await exec(ytdlp, ["--no-playlist", "-o", output, url], { maxBuffer: 4 * 1024 * 1024 });
    return output;
  }

  await update({ status: "downloading", stage: "downloading", progress: 20, message: "Downloading source video..." });
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error(`Source download failed with HTTP ${response.status}`);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) throw new Error("Source video exceeds the configured size limit");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) throw new Error("Source video exceeds the configured size limit");
  await writeFile(output, buffer);
  return output;
}
