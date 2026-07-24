export async function getClipSignedUrl(clipId: string, accessToken: string) {
  const response = await fetch(`/api/clips/${encodeURIComponent(clipId)}/url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Could not create a clip URL.");
  return body.url as string;
}
