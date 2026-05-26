// src/lib/utils/playbackSwitchTiming.ts

export const TRACK_SWITCH_PROTECTION_MS = 8000;

export function isWithinTrackSwitchProtectionWindow(
    trackSwitchTime: number,
    now: number = Date.now()
): boolean {
    return now - trackSwitchTime < TRACK_SWITCH_PROTECTION_MS;
}