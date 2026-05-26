// src/lib/utils/calculatePlaybackTiming.ts

type PlaybackTimingInput = {
    elapsedMs?: unknown;
    durationMs?: unknown;

    elapsed_ms?: unknown;
    duration_ms?: unknown;

    elapsedSec?: unknown;
    durationSec?: unknown;

    elapsed_sec?: unknown;
    duration_sec?: unknown;

    elapsed_seconds?: unknown;
    duration_seconds?: unknown;

    context?: {
        elapsed_seconds?: unknown;
        duration_seconds?: unknown;

        elapsed_sec?: unknown;
        duration_sec?: unknown;

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

export function calculatePlaybackTiming(
    data: PlaybackTimingInput
): PlaybackTiming {

    const elapsedMs =
        typeof data.elapsedMs === 'number'
            ? data.elapsedMs
            : typeof data.elapsed_ms === 'number'
                ? data.elapsed_ms
                : typeof data.elapsedSec === 'number'
                    ? Math.round(data.elapsedSec * 1000)
                    : typeof data.elapsed_sec === 'number'
                        ? Math.round(data.elapsed_sec * 1000)
                        : typeof data.elapsed_seconds === 'number'
                            ? Math.round(data.elapsed_seconds * 1000)
                            : typeof data.context?.elapsed_seconds === 'number'
                                ? Math.round(data.context.elapsed_seconds * 1000)
                                : typeof data.context?.elapsed_sec === 'number'
                                    ? Math.round(data.context.elapsed_sec * 1000)
                                    : 0;

    const durationMs =
        typeof data.durationMs === 'number'
            ? data.durationMs
            : typeof data.duration_ms === 'number'
                ? data.duration_ms
                : typeof data.durationSec === 'number'
                    ? Math.round(data.durationSec * 1000)
                    : typeof data.duration_sec === 'number'
                        ? Math.round(data.duration_sec * 1000)
                        : typeof data.duration_seconds === 'number'
                            ? Math.round(data.duration_seconds * 1000)
                            : typeof data.context?.durationMs === 'number'
                                ? data.context.durationMs
                                : typeof data.context?.duration_ms === 'number'
                                    ? data.context.duration_ms
                                    : typeof data.context?.duration_seconds === 'number'
                                        ? Math.round(data.context.duration_seconds * 1000)
                                        : typeof data.context?.duration_sec === 'number'
                                            ? Math.round(data.context.duration_sec * 1000)
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