// src/lib/api/playbackPauseLoader.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function loadDecadeGenrePauseMode({
  decade,
  genre
}: {
  decade: string;
  genre: string;
}) {
  console.log(
    '🔥 USING playbackPauseLoader → /playback/decade-genre',
    { decade, genre }
  );

  console.log('🔥 ABOUT TO FETCH PAUSE MODE');

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

  const data = await res.json();
  console.log('🧪 PAUSE MODE RESPONSE', data);

  console.log('🧪 SAMPLE TRACK', data.tracks[0]);


  return data;
}
