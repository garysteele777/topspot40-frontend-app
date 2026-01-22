// src/lib/carmode/CarMode.loader.ts
import {tracks, currentTrack, status} from '$lib/carmode/CarMode.store';
import {cacheKey, applyPlaybackOrder, pickInitialTrack} from '$lib/helpers/car/trackUtils';
import type {SelectionState} from '$lib/stores/selection';
import type {LoadedTrack} from '$lib/utils/normalizeTrack';
import {loadTrackSequence, loadFirstTrack} from '$lib/helpers/trackSequenceLoader';

const sequenceCache = new Map<string, LoadedTrack[]>();

export async function loadForSelection(
    sel: SelectionState,
    initialRank?: number | null
): Promise<void> {
    status.set('Loading tracks…');
    tracks.set([]);
    currentTrack.set(null);

    const isPauseMode = sel.pauseMode === 'pause';

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
            currentTrack.set(first);
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

                const ordered = applyPlaybackOrder(loaded, sel.playbackOrder);
                tracks.set(ordered);

                if (initialRank != null) {
                    const candidate = ordered.find((t) => t.rank === initialRank);
                    if (candidate) currentTrack.set(candidate);
                } else {
                    const first = pickInitialTrack(ordered, sel.playbackOrder, sel.startRank, sel.endRank);
                    if (first) currentTrack.set(first);
                }

                status.set(`Loaded ${ordered.length} tracks.`);
            });
        } else {
            const ordered = applyPlaybackOrder(cached, sel.playbackOrder);
            tracks.set(ordered);
            status.set(`Loaded ${ordered.length} tracks.`);
        }

    } catch (err) {
        console.error('Failed to load tracks', err);
        status.set('Failed to load tracks.');
        return;
    }

// ─────────────────────────────────────────────
// 3️⃣ AUTO-START BACKEND SEQUENCE (continuous mode)
// ─────────────────────────────────────────────
    if (!isPauseMode) {
        console.log("🚀 Auto-starting backend sequence for mode:", sel.mode);

        if (sel.mode === "decade_genre") {
            await fetch(`/api/playback/start-decade-genre`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    decade: sel.context?.decade,
                    genre: sel.context?.genre,
                    startRank: sel.startRank,
                    endRank: sel.endRank,
                    order: sel.playbackOrder,
                    language: sel.language,
                    voices: sel.voices,
                    voicePlayMode: sel.voicePlayMode,
                    pauseMode: sel.pauseMode
                })
            });
        }

        if (sel.mode === "collection") {
            await fetch(`/api/playback/start-collection`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    collection_slug: sel.context?.collection_slug,
                    startRank: sel.startRank,
                    endRank: sel.endRank,
                    order: sel.playbackOrder,
                    language: sel.language,
                    voices: sel.voices,
                    voicePlayMode: sel.voicePlayMode,
                    pauseMode: sel.pauseMode
                })
            });
        }
    }


}
