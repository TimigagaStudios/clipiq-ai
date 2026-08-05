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

export async function beginProviderConnection(provider: ProviderName, accessToken: string) {
  const response = await fetch(`/api/providers/${provider}/connect`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Could not start provider connection.");
  return body.authUrl as string;
}
