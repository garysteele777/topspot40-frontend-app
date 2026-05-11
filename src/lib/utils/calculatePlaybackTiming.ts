// src/lib/utils/calculatePlaybackTiming.ts

type PlaybackTimingInput = {
    elapsedMs?: unknown;
    durationMs?: unknown;
    context?: {
        elapsed_seconds?: unknown;
        duration_seconds?: unknown;
        duration_ms?: unknown;
        durationMs?: unknown;
    } | null;
};

export type PlaybackTiming = {
    elapsedMs: number;
    durationMs: number;
    elapsedSec: number;
    durationSec: number;
    progressPercent: number;
};

export function calculatePlaybackTiming(data: PlaybackTimingInput): PlaybackTiming {
    const elapsedMs =
        typeof data.elapsedMs === 'number'
            ? data.elapsedMs
            : typeof data.context?.elapsed_seconds === 'number'
                ? Math.round(data.context.elapsed_seconds * 1000)
                : 0;

    const durationMs =
        typeof data.durationMs === 'number'
            ? data.durationMs
            : typeof data.context?.durationMs === 'number'
                ? data.context.durationMs
                : typeof data.context?.duration_ms === 'number'
                    ? data.context.duration_ms
                    : typeof data.context?.duration_seconds === 'number'
                        ? Math.round(data.context.duration_seconds * 1000)
                        : 0;

    const elapsedSecRaw = elapsedMs / 1000;
    const durationSec = durationMs / 1000;

    const elapsedSec =
        durationSec > 0
            ? Math.min(elapsedSecRaw, durationSec)
            : elapsedSecRaw;

    const progressPercent =
        durationSec > 0
            ? Math.min(100, Math.max(0, (elapsedSec / durationSec) * 100))
            : 0;

    return {
        elapsedMs,
        durationMs,
        elapsedSec,
        durationSec,
        progressPercent
    };
}