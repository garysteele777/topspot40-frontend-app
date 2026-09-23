import { writable } from 'svelte/store';

export type PlaybackView = 'car' | 'studio';

export const playbackView = writable<PlaybackView>('car');

export function setPlaybackView(view: PlaybackView) {
    playbackView.set(view);
}

export function togglePlaybackView() {
    playbackView.update(view =>
        view === 'car' ? 'studio' : 'car'
    );
}