// src/lib/api/playbackPauseLoader.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function loadDecadeGenrePauseMode({
  decade,
  genre
}: {
  decade: string;
  genre: string;
}) {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not defined');
  }

  const url = `${API_BASE}/playback/decade-genre?decade=${encodeURIComponent(
    decade
  )}&genre=${encodeURIComponent(genre)}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pause-mode fetch failed (${res.status}): ${text}`);
  }

  return await res.json();
}