// src/lib/audio/narrationAudioCleanup.ts

import { timingSource } from '$lib/carmode/CarMode.store';
import { resetPlaybackProgress } from '$lib/utils/resetPlaybackState';

export function cleanupNarrationAudio({
    timer,
    setTimer,
    setAudio,
    setResolve,
    preserveAudio = false
}: {
    timer: number | null;
    setTimer: (value: number | null) => void;
    setAudio: (value: HTMLAudioElement | null) => void;
    setResolve: (value: (() => void) | null) => void;
    preserveAudio?: boolean;
}): void {
    if (timer !== null) {
        clearInterval(timer);
        setTimer(null);
    }

    if (!preserveAudio) {
        setAudio(null);
    }
    setResolve(null);

    resetPlaybackProgress();
    timingSource.set('spotify');
}
