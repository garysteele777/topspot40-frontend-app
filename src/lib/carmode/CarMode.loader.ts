// src/lib/carmode/CarMode.loader.ts
import {tracks, currentTrack, status} from '$lib/carmode/CarMode.store';
import {cacheKey, applyPlaybackOrder, pickInitialTrack} from '$lib/helpers/car/trackUtils';
import type {SelectionState} from '$lib/stores/selection';
import type {LoadedTrack} from '$lib/utils/normalizeTrack';
import type {CarModeTrack} from '$lib/carmode/CarMode.store';

import {loadTrackSequence, loadFirstTrack} from '$lib/helpers/trackSequenceLoader';
import {getFavorites} from '$lib/favorites/favorites';


const sequenceCache = new Map<string, LoadedTrack[]>();

export async function loadForSelection(
    sel: SelectionState,
    initialRank?: number | null
): Promise<void> {
    status.set('Loading tracks…');
    tracks.set([]);
    currentTrack.set(null);


    try {
        const key = cacheKey(sel);
        const cached = sequenceCache.get(key);

        // ─────────────────────────────────────────────
        // 1️⃣ LOAD FIRST TRACK (DATA ONLY — NO AUDIO)
        // ─────────────────────────────────────────────
        let first: LoadedTrack | null = null;

        if (cached?.length) {
            const orderedCached = applyPlaybackOrder(cached, sel.playbackOrder);
            first = pickInitialTrack(orderedCached, sel.playbackOrder, sel.startRank, sel.endRank);
        } else {
            first = await loadFirstTrack(sel);
        }

        // ✅ Pause mode: do NOT auto-play
        if (first) {
            currentTrack.set(toCarModeTrack(first));
        }


        status.set('Tracks loaded. Press Play.');

        // ─────────────────────────────────────────────
        // 2️⃣ BACKGROUND FULL SEQUENCE LOAD (DATA ONLY)
        // ─────────────────────────────────────────────
        if (!cached) {
            loadTrackSequence(sel).then((loaded) => {
                if (!loaded.length) {
                    status.set('No tracks found.');
                    return;
                }

                sequenceCache.set(key, loaded);

                let filtered = loaded;

                const isFavorites =
                    sel.mode === 'decade_genre' &&
                    sel.context?.genre === 'favorites';

                if (isFavorites) {
                    const decade = sel.context?.decade;

                    if (decade) {
                        const favoriteIds = getFavorites('DG', decade);

                        if (favoriteIds.length === 0) {
                            status.set(`⭐ No favorites yet for ${decade}.`);
                            tracks.set([]);
                            currentTrack.set(null);
                            return;
                        }

                        filtered = loaded.filter(
                            (t): t is LoadedTrack & { rankingId: number } =>
                                typeof t.rankingId === 'number' &&
                                favoriteIds.includes(t.rankingId)
                        );
                    }
                }

                const order = isFavorites ? 'shuffle' : sel.playbackOrder;

                const ordered = applyPlaybackOrder(filtered, order);
                tracks.set(ordered.map(toCarModeTrack));

                const firstTrack = isFavorites
                    ? ordered[0] ?? null
                    : pickInitialTrack(
                        ordered,
                        sel.playbackOrder,
                        sel.startRank,
                        sel.endRank
                    );

                if (firstTrack) {
                    currentTrack.set(toCarModeTrack(firstTrack));
                }

                status.set(`Loaded ${ordered.length} tracks.`);
            });

        } else {
            let filtered = cached;

            const isFavorites =
                sel.mode === 'decade_genre' &&
                sel.context?.genre === 'favorites';

            if (isFavorites) {
                const decade = sel.context?.decade;

                if (decade) {
                    const favoriteIds = getFavorites('DG', decade);

                    if (favoriteIds.length === 0) {
                        status.set(`⭐ No favorites yet for ${decade}.`);
                        tracks.set([]);
                        currentTrack.set(null);
                        return;
                    }

                    filtered = cached.filter(
                        (t): t is LoadedTrack & { rankingId: number } =>
                            typeof t.rankingId === 'number' &&
                            favoriteIds.includes(t.rankingId)
                    );
                }
            }

            const order = isFavorites ? 'shuffle' : sel.playbackOrder;

            const ordered = applyPlaybackOrder(filtered, order);
            tracks.set(ordered.map(toCarModeTrack));

            const firstTrack = isFavorites
                ? ordered[0] ?? null
                : pickInitialTrack(
                    ordered,
                    sel.playbackOrder,
                    sel.startRank,
                    sel.endRank
                );

            if (firstTrack) {
                currentTrack.set(toCarModeTrack(firstTrack));
            }

            status.set(`Loaded ${ordered.length} tracks.`);

        }

    } catch (err) {
        console.error('Failed to load tracks', err);
        status.set('Failed to load tracks.');
        return;
    }

    console.log("🧊 Loader finished. No playback started. Waiting for Play button.");


}

function toCarModeTrack(t: LoadedTrack): CarModeTrack {
    return {
        ...t,
        rankingId: t.rankingId ?? null


    };
}
