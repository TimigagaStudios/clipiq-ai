export const exportProfiles = {
  Download: { aspectRatio: "16:9", label: "Landscape" },
  TikTok: { aspectRatio: "9:16", label: "Vertical" },
  Instagram: { aspectRatio: "9:16", label: "Vertical" },
  YouTube: { aspectRatio: "9:16", label: "Shorts" },
} as const;

export type CaptionStyle = "default" | "bold" | "subtitle" | "comic";
export type ExportAspectRatio = "16:9" | "9:16" | "1:1";
