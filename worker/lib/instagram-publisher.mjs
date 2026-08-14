export async function publishInstagram(request, context) {
  const { supabase, supabaseUrl, serviceRoleKey, bucket, accessToken } = context;
  const [connections, clips] = await Promise.all([
    supabase(`provider_connections?user_id=eq.${encodeURIComponent(request.user_id)}&provider=eq.instagram&select=metadata,status`),
    supabase(`clips?id=eq.${encodeURIComponent(request.clip_id)}&user_id=eq.${encodeURIComponent(request.user_id)}&select=video_url,title,hook`),
  ]);
  const accountId = connections?.[0]?.metadata?.provider_account_id;
  const clip = clips?.[0];
  if (!accountId || connections?.[0]?.status !== 'connected' || !clip?.video_url) throw new Error('Instagram connection or rendered clip is unavailable.');
  const signed = await supabase(`storage/v1/object/sign/${bucket}/${clip.video_url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 3600 }) });
  const videoUrl = `${supabaseUrl}/storage/v1${signed.signedURL || signed.signedUrl}`;
  const container = await graphPost(`${accountId}/media`, { media_type: 'REELS', video_url: videoUrl, caption: request.title || clip.hook || 'Created with ClipIQ AI', access_token: accessToken });
  const published = await graphPost(`${accountId}/media_publish`, { creation_id: container.id, access_token: accessToken });
  return { status: 'published', providerPostId: published.id };
}

async function graphPost(path, params) {
  const response = await fetch(`https://graph.facebook.com/v20.0/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(body.error?.message || 'Instagram publishing failed.');
  return body;
}
