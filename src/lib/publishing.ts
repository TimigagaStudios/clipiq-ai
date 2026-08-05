export type PublishPlatform = "TikTok" | "Instagram" | "YouTube";
export type PublishStatus = "queued" | "publishing" | "published" | "failed";

export type PublishRequest = {
  id: string;
  clipId: string;
  platform: PublishPlatform;
  title: string | null;
  status: PublishStatus;
  providerPostId: string | null;
  error: string | null;
  createdAt: string;
  publishedAt: string | null;
};

export const publishPlatformLabels: Record<PublishPlatform, string> = {
  TikTok: "TikTok",
  Instagram: "Instagram Reels",
  YouTube: "YouTube Shorts",
};
