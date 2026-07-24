import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function transcribeAudio(audioPath) {
  const command = process.env.CLIPIQ_TRANSCRIBER_COMMAND || process.env.FASTER_WHISPER_COMMAND;
  if (!command) {
    return "Local transcription fallback. Configure CLIPIQ_TRANSCRIBER_COMMAND or FASTER_WHISPER_COMMAND to activate Faster-Whisper.";
  }
  const { stdout } = await exec(command, [audioPath], { maxBuffer: 20 * 1024 * 1024 });
  return stdout.trim();
}
