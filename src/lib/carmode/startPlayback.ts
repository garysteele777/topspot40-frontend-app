// src/lib/carmode/startPlayback.ts
import { get } from 'svelte/store';
import { currentSelection, currentTrack, tracks } from '$lib/carmode/CarMode.store';
import { updateTrack } from '$lib/carmode/CarMode.player';

export async function startPlayback() {
    const sel = get(currentSelection);
    if (!sel) return;

    // If user is already looking at a specific track, use that
    const track = get(currentTrack) ?? get(tracks)?.[0];
    if (!track) return;

    const isSingle = sel.startRank === sel.endRank;

    // ──────────────────────────────────────────
    // SINGLE TRACK MODE → Use frontend player
    // ──────────────────────────────────────────
    if (isSingle) {
        console.log("🎯 SINGLE TRACK MODE → updateTrack()");
        updateTrack(track);
        return;
    }

    // ──────────────────────────────────────────
    // CONTINUOUS MODE → Call sequence backend
    // ──────────────────────────────────────────
    const params = new URLSearchParams();

    params.set(
        'mode',
        sel.playbackOrder === 'shuffle'
            ? 'random'
            : sel.playbackOrder === 'down'
            ? 'count_down'
            : 'count_up'
    );

    params.set('start_rank', String(sel.startRank));
    params.set('end_rank', String(sel.endRank));
    params.set('tts_language', sel.language);
    params.set('voice_style', sel.voicePlayMode);

    params.set('play_intro', String(sel.voices.includes('intro')));
    params.set('play_detail', String(sel.voices.includes('detail')));
    params.set('play_artist_description', String(sel.voices.includes('artist')));
    params.set('play_track', 'true');

    if (sel.mode === 'decade_genre') {
        params.set('decade', sel.context?.decade ?? '');
        params.set('genre', sel.context?.genre ?? '');

        await fetch(
            `http://127.0.0.1:8000/supabase/decade-genre/play-first?${params.toString()}`
        );
        return;
    }

    if (sel.mode === 'collection') {
        params.set('slug', sel.context?.collection_slug ?? '');

        await fetch(
            `http://127.0.0.1:8000/supabase/collections/play-collection-sequence?${params.toString()}`
        );
        return;
    }
}
