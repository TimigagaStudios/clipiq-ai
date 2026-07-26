import { writeFile } from "node:fs/promises";

const styles = {
  default: "FontName=Arial,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1",
  bold: "FontName=Arial,FontSize=22,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=3,Shadow=1",
  subtitle: "FontName=Arial,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2",
  comic: "FontName=Comic Sans MS,FontSize=20,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=3,Shadow=1",
};

export async function writeCaptionFile(directory, transcript, style = "default") {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const lines = [];
  const chunkSize = 9;
  for (let index = 0; index < words.length; index += chunkSize) {
    const start = index / 2;
    const end = Math.min(words.length / 2, start + 4);
    lines.push(`${lines.length + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${words.slice(index, index + chunkSize).join(" ")}\n`);
  }
  const file = `${directory}/captions-${style}.srt`;
  await writeFile(file, lines.join("\n"));
  return file;
}

export function captionStyleName(style) {
  return styles[style] ? style : "default";
}

function srtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}
