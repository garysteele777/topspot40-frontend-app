// src/lib/utils/buildNarrationQueue.ts

import type {NarrationPhase} from '$lib/utils/playbackPhaseHelpers';

export type NarrationQueueItem = {
    url: string;
    phase: NarrationPhase;
};

type NarrationContext = {
    audio_url?: unknown;
    audio_queue?: unknown;
};

export function buildNarrationQueue(
    phase: NarrationPhase,
    context: NarrationContext | null | undefined
): NarrationQueueItem[] {

    if (!context) return [];

    const urls =
        Array.isArray(context.audio_queue)
            ? context.audio_queue
                .map((item: { url?: unknown }) => item.url)
                .filter(
                    (url: unknown): url is string =>
                        typeof url === 'string' &&
                        url.length > 0
                )
            : typeof context.audio_url === 'string'
                ? [context.audio_url]
                : [];

    return urls.map(url => ({
        url,
        phase
    }));
}