console.warn("⚠️ CarMode.player.ts is currently disabled. Backend owns playback.");

import type { LoadedTrack } from '$lib/utils/normalizeTrack';

export function updateTrack(_track: LoadedTrack): void {
    console.warn(
        '⚠️ updateTrack() called, but CarMode.player.ts is disabled. Backend owns playback.'
    );
}
