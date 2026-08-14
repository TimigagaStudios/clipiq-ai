import { createDecipheriv } from "node:crypto";
import { publishInstagram } from "./instagram-publisher.mjs";
import { publishYouTube } from "./youtube-publisher.mjs";

const supportedPlatforms = new Set(["TikTok", "Instagram", "YouTube"]);

export function isPublishPlatform(value) {
  return supportedPlatforms.has(value);
}

export async function publishClip(request, context) {
  if (!isPublishPlatform(request.platform)) throw new Error(`Unsupported publishing platform: ${request.platform}`);
  if (request.platform === "YouTube") return publishYouTube(request, context);
  if (request.platform === "Instagram") {
    const secrets = await context.supabase(`provider_secrets?user_id=eq.${encodeURIComponent(request.user_id)}&provider=eq.instagram&select=encrypted_access_token,encryption_iv,encryption_tag`);
    const secret = secrets?.[0];
    if (!secret) throw new Error("Instagram connection secret is unavailable.");
    const accessToken = decrypt(secret.encrypted_access_token, secret.encryption_iv, secret.encryption_tag, context.encryptionKey);
    return publishInstagram(request, { ...context, accessToken });
  }
  return { status: "queued", message: "TikTok publishing remains Deployment Pending." };
}

function decrypt(value, ivValue, tagValue, key) {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(value, "base64url")), decipher.final()]).toString("utf8");
}
