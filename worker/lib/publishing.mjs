import { publishYouTube } from "./youtube-publisher.mjs";

const supportedPlatforms = new Set(["TikTok", "Instagram", "YouTube"]);

export function isPublishPlatform(value) {
  return supportedPlatforms.has(value);
}

export async function publishClip(request, context) {
  if (!isPublishPlatform(request.platform)) throw new Error(`Unsupported publishing platform: ${request.platform}`);
  if (request.platform === "YouTube") return publishYouTube(request, context);
  return { status: "queued", message: `${request.platform} publishing remains Deployment Pending.` };
}
