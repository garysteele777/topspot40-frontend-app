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

function getQueueItemUrl(item: unknown): string | null {
    if (typeof item === 'string') {
        return item.length > 0 ? item : null;
    }

    if (!item || typeof item !== 'object') {
        return null;
    }

    const record = item as { url?: unknown; audio_url?: unknown };

    if (typeof record.url === 'string' && record.url.length > 0) {
        return record.url;
    }

    if (typeof record.audio_url === 'string' && record.audio_url.length > 0) {
        return record.audio_url;
    }

    return null;
}

export function buildNarrationQueue(
    phase: NarrationPhase,
    context: NarrationContext | null | undefined
): NarrationQueueItem[] {

    if (!context) return [];

    const urls =
        Array.isArray(context.audio_queue)
            ? context.audio_queue
                .map(getQueueItemUrl)
                .filter(
                    (url: string | null): url is string => url !== null
                )
            : typeof context.audio_url === 'string'
                ? [context.audio_url]
                : [];

    return urls.map(url => ({
        url,
        phase
    }));
}
