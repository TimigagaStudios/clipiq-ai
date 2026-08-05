const supportedPlatforms = new Set(["TikTok", "Instagram", "YouTube"]);

export function isPublishPlatform(value) {
  return supportedPlatforms.has(value);
}

export async function publishClip(request) {
  if (!isPublishPlatform(request.platform)) throw new Error(`Unsupported publishing platform: ${request.platform}`);
  const command = process.env.CLIPIQ_PUBLISH_COMMAND;
  if (!command) {
    return { status: "queued", message: "Publishing adapter is configured but no provider command is enabled." };
  }
  throw new Error("Provider publishing command integration is Deployment Pending.");
}
