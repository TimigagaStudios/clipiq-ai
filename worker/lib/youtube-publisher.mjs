import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export async function publishYouTube(request, context) {
  const { supabase, supabaseUrl, serviceRoleKey, bucket, encryptionKey } = context;
  const [secretsRows, connectionRows, clips] = await Promise.all([
    supabase(`provider_secrets?user_id=eq.${encodeURIComponent(request.user_id)}&provider=eq.youtube&select=*`),
    supabase(`provider_connections?user_id=eq.${encodeURIComponent(request.user_id)}&provider=eq.youtube&select=*`),
    supabase(`clips?id=eq.${encodeURIComponent(request.clip_id)}&user_id=eq.${encodeURIComponent(request.user_id)}&select=video_url,title,hook`),
  ]);
  const secret = secretsRows?.[0];
  const connection = connectionRows?.[0];
  const clip = clips?.[0];
  if (!secret || !clip?.video_url || connection?.status !== "connected") throw new Error("YouTube connection or rendered clip is unavailable.");

  let accessToken = decrypt(secret.encrypted_access_token, secret.encryption_iv, secret.encryption_tag, encryptionKey);
  if (connection.token_expires_at && new Date(connection.token_expires_at).getTime() <= Date.now() + 60_000) {
    if (!secret.encrypted_refresh_token || !secret.refresh_encryption_iv || !secret.refresh_encryption_tag) throw new Error("YouTube token expired and no refresh token is available.");
    const refreshToken = decrypt(secret.encrypted_refresh_token, secret.refresh_encryption_iv, secret.refresh_encryption_tag, encryptionKey);
    const refreshed = await refreshYouTubeToken(refreshToken);
    accessToken = refreshed.access_token;
    const encrypted = encrypt(accessToken, encryptionKey);
    await supabase(`provider_secrets?id=eq.${encodeURIComponent(secret.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ encrypted_access_token: encrypted.value, encryption_iv: encrypted.iv, encryption_tag: encrypted.tag, updated_at: new Date().toISOString() }) });
    await supabase(`provider_connections?id=eq.${encodeURIComponent(connection.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ token_expires_at: new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000).toISOString(), updated_at: new Date().toISOString() }) });
  }

  const videoResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${clip.video_url}`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
  if (!videoResponse.ok) throw new Error(`Rendered clip download failed (${videoResponse.status}).`);
  const video = Buffer.from(await videoResponse.arrayBuffer());
  const metadata = { snippet: { title: request.title || clip.title || "ClipIQ Short", description: clip.hook || "Created with ClipIQ AI" }, status: { privacyStatus: "private", selfDeclaredMadeForKids: false } };
  const boundary = `clipiq-${randomBytes(12).toString("hex")}`;
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`), video, Buffer.from(`\r\n--${boundary}--`)]);
  const upload = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}`, "Content-Length": String(body.length) }, body });
  const result = await upload.json();
  if (!upload.ok || !result.id) throw new Error(result.error?.message || "YouTube upload failed.");
  return { status: "published", providerPostId: result.id };
}

async function refreshYouTubeToken(refreshToken) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.YOUTUBE_CLIENT_ID || "", client_secret: process.env.YOUTUBE_CLIENT_SECRET || "", refresh_token: refreshToken, grant_type: "refresh_token" }) });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error(body.error_description || "YouTube token refresh failed.");
  return body;
}

function decrypt(value, ivValue, tagValue, key) {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(value, "base64url")), decipher.final()]).toString("utf8");
}

function encrypt(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return { value: encrypted.toString("base64url"), iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url") };
}
