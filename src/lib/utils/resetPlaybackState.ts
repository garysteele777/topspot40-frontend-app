// src/lib/utils/resetPlaybackState.ts

import {
    elapsed,
    duration,
    progress
} from '$lib/carmode/CarMode.store';

export function resetPlaybackProgress(): void {
    elapsed.set(0);
    duration.set(0);
    progress.set(0);
}