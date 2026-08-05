export type ProviderName = "youtube" | "instagram" | "tiktok";
export type ProviderConnectionStatus = "connected" | "expired" | "error" | "disconnected";

export type ProviderConnection = {
  id: string;
  provider: ProviderName;
  status: ProviderConnectionStatus;
  providerAccountName: string | null;
  scopes: string[];
  tokenExpiresAt: string | null;
  lastError: string | null;
};

export const providerLabels: Record<ProviderName, string> = {
  youtube: "YouTube Shorts",
  instagram: "Instagram Reels",
  tiktok: "TikTok",
};
