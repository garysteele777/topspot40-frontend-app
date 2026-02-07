// src/lib/api/preview.ts

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

type PreviewPayload = Record<string, unknown>;

async function postPreview<T>(url: string, payload: PreviewPayload): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Preview failed ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function getTrackSequencePreview(payload: PreviewPayload) {
  return postPreview(
    `${API_BASE}/api/playback/preview/track`,
    payload
  );
}

export function getCollectionSequencePreview(payload: PreviewPayload) {
  return postPreview(
    `${API_BASE}/api/playback/preview/collection`,
    payload
  );
}
