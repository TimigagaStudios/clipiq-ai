const profiles = {
  landscape: { aspectRatio: "16:9", width: 1080, height: 608 },
  vertical: { aspectRatio: "9:16", width: 608, height: 1080 },
  square: { aspectRatio: "1:1", width: 1080, height: 1080 },
};

export function getRenderProfile(name = "landscape") {
  return profiles[name] || profiles.landscape;
}

export function videoFilterFor(name, captionFile = "") {
  const profile = getRenderProfile(name);
  const filters = [`scale=${profile.width}:${profile.height}:force_original_aspect_ratio=increase`, `crop=${profile.width}:${profile.height}`];
  if (captionFile) filters.push(`subtitles=${escapeFilterPath(captionFile)}`);
  return filters.join(",");
}

function escapeFilterPath(path) {
  return path.replaceAll("\\", "/").replaceAll(":", "\\:").replaceAll("'", "\\'");
}
