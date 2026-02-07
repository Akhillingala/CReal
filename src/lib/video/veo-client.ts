/**
 * CReal - Veo video generation client (REST)
 * Generates short (<15s) clips via Google Veo 3.1 using the Gemini API.
 * Uses 8-second duration for an infographic/news-cartoon style explainer.
 */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'veo-3.1-generate-preview';
const POLL_INTERVAL_MS = 8000;
const MAX_POLL_ATTEMPTS = 30; // ~4 minutes max

export interface VeoGenerateResult {
  videoBase64: string;
  mimeType: string;
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  };
}

/**
 * Start a long-running video generation job. Returns operation name.
 */
async function startGeneration(
  apiKey: string,
  prompt: string
): Promise<string> {
  const url = `${BASE_URL}/models/${MODEL}:predictLongRunning`;
  const body = {
    instances: [{ prompt }],
    parameters: {
      durationSeconds: 8,
      aspectRatio: '16:9',
      resolution: '720p',
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Veo start failed: ${res.status} ${errText}`);
  }
  const data = (await res.json()) as { name?: string };
  const name = data?.name;
  if (!name || typeof name !== 'string') {
    throw new Error('Veo start: missing operation name in response');
  }
  return name;
}

/**
 * Poll operation until done. Returns the raw operation response when done.
 */
async function pollOperation(
  apiKey: string,
  operationName: string
): Promise<Record<string, unknown>> {
  const url = operationName.startsWith('http')
    ? operationName
    : `${BASE_URL}/${operationName}`;
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await fetch(url, {
      method: 'GET',
      headers: authHeaders(apiKey),
    });
    if (!res.ok) {
      throw new Error(`Veo poll failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { done?: boolean; error?: { message?: string }; response?: Record<string, unknown> };
    if (data.error?.message) {
      throw new Error(`Veo error: ${data.error.message}`);
    }
    if (data.done) {
      return (data.response as Record<string, unknown>) ?? {};
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error('Veo generation timed out');
}

/**
 * Extract video URI from operation response. Tries multiple response shapes
 * (Gemini REST: response.generateVideoResponse.generatedSamples[0].video.uri,
 *  plus camelCase/snake_case and SDK-style variants.)
 */
function getVideoUri(response: Record<string, unknown>): string | null {
  if (!response || typeof response !== 'object') return null;

  // Debug: Log the full response structure
  console.log('[CReal Veo] Full response:', JSON.stringify(response, null, 2));

  // Path 1: generateVideoResponse.generatedSamples[0].video.uri (Gemini REST, camelCase)
  const gen = response.generateVideoResponse as Record<string, unknown> | undefined;
  if (gen && typeof gen === 'object') {
    console.log('[CReal Veo] Found generateVideoResponse:', JSON.stringify(gen, null, 2));

    const samples =
      (gen.generatedSamples as unknown[] | undefined) ??
      (gen.generated_samples as unknown[] | undefined);

    if (samples && Array.isArray(samples)) {
      console.log('[CReal Veo] Found samples array, length:', samples.length);
      const firstSample = samples[0] as Record<string, unknown> | undefined;
      if (firstSample && typeof firstSample === 'object') {
        console.log('[CReal Veo] First sample:', JSON.stringify(firstSample, null, 2));

        // Try direct video property
        const video = firstSample.video as Record<string, unknown> | undefined;
        if (video && typeof video === 'object') {
          const uri = video.uri;
          if (typeof uri === 'string') {
            console.log('[CReal Veo] Found URI in video.uri:', uri);
            return uri;
          }
        }

        // Try URI directly on sample
        const directUri = firstSample.uri;
        if (typeof directUri === 'string') {
          console.log('[CReal Veo] Found URI directly on sample:', directUri);
          return directUri;
        }
      }
    }
  }

  // Path 2: generatedVideos[0].video.uri (SDK-style)
  const generatedVideos = response.generatedVideos as unknown[] | undefined;
  if (generatedVideos && Array.isArray(generatedVideos)) {
    const firstGen = generatedVideos[0] as Record<string, unknown> | undefined;
    const videoFromGen = firstGen?.video as Record<string, unknown> | undefined;
    const uri2 = videoFromGen?.uri;
    if (typeof uri2 === 'string') return uri2;
  }

  // Path 3: videos[0].gcsUri or videos[0].uri (Vertex REST-style)
  const videos = response.videos as unknown[] | undefined;
  if (videos && Array.isArray(videos)) {
    const firstVideo = videos[0] as Record<string, unknown> | undefined;
    const gcsUri = firstVideo?.gcsUri ?? firstVideo?.uri;
    if (typeof gcsUri === 'string') return gcsUri;
  }

  // Path 4: Deep search inside generateVideoResponse for any array of items with .video.uri
  if (gen && typeof gen === 'object') {
    for (const key of Object.keys(gen)) {
      const arr = gen[key] as unknown[] | undefined;
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0] as Record<string, unknown> | undefined;
        if (first && typeof first === 'object') {
          const video = first.video as Record<string, unknown> | undefined;
          const u = video?.uri ?? first?.uri;
          if (typeof u === 'string' && (u.startsWith('http') || u.startsWith('gs://')))
            return u;
        }
      }
    }
  }

  // Path 5: Check if response itself has a uri field
  const topLevelUri = response.uri;
  if (typeof topLevelUri === 'string') return topLevelUri;

  console.error('[CReal Veo] Could not find video URI in response. Available keys:', Object.keys(response));
  return null;
}

/**
 * Download video from URI (with API key for auth) and return as base64.
 */
async function downloadVideo(apiKey: string, uri: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(uri, {
    headers: { 'x-goog-api-key': apiKey },
  });
  if (!res.ok) {
    throw new Error(`Veo download failed: ${res.status}`);
  }
  const blob = await res.blob();
  const mimeType = blob.type || 'video/mp4';
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return { base64, mimeType };
}

/**
 * Generate an 8-second infographic-style video from a text prompt. Returns base64-encoded video.
 */
export async function generateVideo(
  apiKey: string,
  prompt: string
): Promise<VeoGenerateResult> {
  const operationName = await startGeneration(apiKey, prompt);
  const response = await pollOperation(apiKey, operationName);
  const uri = getVideoUri(response);
  if (!uri) {
    const keys = response && typeof response === 'object' ? Object.keys(response).join(', ') : 'empty';
    throw new Error(`Veo response missing video URI. Response keys: ${keys || '(none)'}`);
  }
  // gs:// URIs require GCS auth; only https is supported for direct fetch
  if (uri.startsWith('gs://')) {
    throw new Error(
      'Veo returned a Cloud Storage URI (gs://). This extension only supports direct download URLs. Try using Google AI Studio / Gemini API with a key that returns https URLs, or use Vertex AI with a GCS bucket and download the file separately.'
    );
  }
  const { base64, mimeType } = await downloadVideo(apiKey, uri);
  return { videoBase64: base64, mimeType };
}
