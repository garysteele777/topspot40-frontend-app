// src/lib/audio/narrationAudioCleanup.ts

import { timingSource } from '$lib/carmode/CarMode.store';
import { resetPlaybackProgress } from '$lib/utils/resetPlaybackState';

export function cleanupNarrationAudio({
    timer,
    setTimer,
    setAudio,
    setResolve
}: {
    timer: number | null;
    setTimer: (value: number | null) => void;
    setAudio: (value: HTMLAudioElement | null) => void;
    setResolve: (value: (() => void) | null) => void;
}): void {
    if (timer !== null) {
        clearInterval(timer);
        setTimer(null);
    }

    setAudio(null);
    setResolve(null);

    resetPlaybackProgress();
    timingSource.set('spotify');
}