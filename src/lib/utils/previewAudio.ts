// src/lib/utils/previewAudio.ts
import { writable } from 'svelte/store';

let current: HTMLAudioElement | null = null;
let currentId: string | null = null;

export const playingId = writable<string | null>(null);

export async function play(id: string, url: string) {
  if (current) {
    current.pause();
    current.currentTime = 0;
  }
  current = new Audio(url);
  currentId = id;
  current.volume = 0.9;

  try {
    await current.play();
    playingId.set(id);
  } catch (err) {
    console.error('Preview play failed:', err);
    playingId.set(null);
  }

  current.onended = () => {
    playingId.set(null);
  };
}

export function stop(id?: string) {
  if (!current) return;
  if (id && currentId && id !== currentId) return;
  current.pause();
  current.currentTime = 0;
  currentId = null;
  playingId.set(null);
}

export function stopAll() {
  stop();
}
