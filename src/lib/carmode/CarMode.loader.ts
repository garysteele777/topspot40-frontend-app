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
    console.log('🚀 LOADER selection.programType =', sel.programType);

    tracks.set([]);
    currentTrack.set(null);


    // ─────────────────────────────────────────────
    // FAVORITES: DECADE
    // ─────────────────────────────────────────────
    if (sel.programType === 'FAV_DG') {

        const decade = sel.context?.decade;

        if (!decade) {
            status.set('Missing decade for favorites.');
            return;
        }

        const favoriteIds = getFavorites('DG', decade);

        if (!favoriteIds.length) {
            status.set(`⭐ No favorites yet for ${decade}.`);
            return;
        }

        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/supabase/decade-genre/get-favorites`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ranking_ids: favoriteIds})
            }
        );

        if (!response.ok) {
            status.set('Failed to load favorites.');
            return;
        }

        const data = await response.json();

        const normalized: LoadedTrack[] = data.tracks.map((t: any) => ({
            ...t,
            id: t.trackId,               // ✅ required for /playback/play-track
            spotifyTrackId: t.spotifyTrackId,
            rankingId: t.rankingId
        }));

        const ordered = applyPlaybackOrder(normalized, 'shuffle');


        if (!data?.tracks?.length) {
            status.set('No favorite tracks found.');
            return;
        }

        tracks.set(ordered.map(toCarModeTrack));
        currentTrack.set(toCarModeTrack(ordered[0]));

        status.set(`Loaded ${ordered.length} favorite tracks.`);
        return;
    }


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
