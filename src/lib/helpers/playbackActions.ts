// src/lib/helpers/playbackActions.ts
import {tick} from 'svelte';
import {goto} from '$app/navigation';

import {loadPreview} from '$lib/helpers/previewLoader';
import {buildCarModeUrl} from '$lib/utils/urlBuilder';
import {
    getTrackSequencePreview,
    getCollectionSequencePreview
} from '$lib/api';
import {toTitleCase} from '$lib/utils/textHelpers';
import type {PreviewTrack} from '$lib/types/tracks';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ApiTrackItem {
    rank: number;
    title?: string;
    trackName?: string;
    artist?: string;
    artistName?: string;
    album_artwork?: string | null;
    image_url?: string | null;
}

export interface OverdubOptions {
    enabled: boolean;
    intro: boolean;
    detail: boolean;
    artist: boolean;
}

export interface StartPlaybackOptions {
    modeType: 'decade_genre' | 'collection';
    selectedDecade: string;
    selectedGenre: string;
    selectedCollection: string;
    collectionSlugMap: Record<string, string>;
    ttsLanguage: string;
    startRank: number;
    endRank: number;
    playbackMode: 'count_up' | 'count_down' | 'random';
    playIntro: boolean;
    playDetail: boolean;
    playArtistDescription: boolean;
    textIntro: boolean;
    textDetail: boolean;
    textArtistDescription: boolean;
    overdub?: OverdubOptions;
    randomAllCategories?: boolean;
    setStatus: (msg: string) => void;
}

interface CollectionPreviewResponse {
    tracks: ApiTrackItem[];
}

type TrackPreviewResponse = ApiTrackItem[];


// ─────────────────────────────────────────────
// 1️⃣ FAST Preview Tracks (NO Supabase Loader)
// ─────────────────────────────────────────────
export async function previewTracksList(opts: {
    modeType: 'decade_genre' | 'collection';
    selectedDecade: string;
    selectedGenre: string;
    selectedCollection: string;
    collectionSlugMap: Record<string, string>;
    ttsLanguage: string;
    startRank: number;
    endRank: number;
    overdub?: OverdubOptions;
    randomAllCategories?: boolean;
    setStatus: (msg: string) => void;
    setPreviewTracks: (tracks: PreviewTrack[]) => void;
    setShowPreview: (visible: boolean) => void;
}) {
    const {
        modeType,
        selectedDecade,
        selectedGenre,
        selectedCollection,
        collectionSlugMap,
        startRank,
        endRank,
        setStatus,
        setPreviewTracks,
        setShowPreview
    } = opts;

    setStatus('📦 Loading preview...');
    await tick();

    try {
        let tracks: ApiTrackItem[] = [];

        // ✅ COLLECTION MODE (FAST)
        if (modeType === 'collection') {
            const slug = collectionSlugMap[selectedCollection] || selectedCollection;

            if (!slug || selectedCollection === 'All') {
                setStatus('⚠️ Please choose a valid Collection.');
                return;
            }

            const preview = (await getCollectionSequencePreview({
                collection_slug: slug,
                start_rank: startRank,
                end_rank: endRank
            })) as CollectionPreviewResponse;

            tracks = preview.tracks;

        }

        // ✅ DECADE / GENRE MODE (FAST)
        else {
            if (
                !selectedDecade ||
                !selectedGenre ||
                selectedDecade === 'All' ||
                selectedGenre === 'All'
            ) {
                setStatus('⚠️ Please select both a Decade and a Genre.');
                return;
            }

            const preview = (await getTrackSequencePreview({
                decade: selectedDecade,
                genre: selectedGenre,
                start_rank: startRank,
                end_rank: endRank
            })) as TrackPreviewResponse;

            tracks = preview;

        }

        // ✅ Map into Preview UI shape
        const previewTracks: PreviewTrack[] = tracks.map((t) => ({
            rank: Number(t.rank ?? 0),
            trackName: toTitleCase(t.title ?? t.trackName ?? 'Unknown Track'),
            artistName: toTitleCase(t.artist ?? t.artistName ?? 'Unknown Artist'),
            albumArtwork: t.album_artwork ?? t.image_url ?? null
        }));

        setPreviewTracks(previewTracks);
        setStatus(`✅ Showing ${previewTracks.length} tracks (${startRank}–${endRank}).`);
        setShowPreview(true);
    } catch (err) {
        console.error('❌ Preview failed:', err);
        setStatus(err instanceof Error ? err.message : '❌ Unknown error loading preview.');
    }
}

// ─────────────────────────────────────────────
// 2️⃣ Start Playback (UNCHANGED — Already Fast)
// ─────────────────────────────────────────────
export async function startPlayback(opts: StartPlaybackOptions) {
    const {
        modeType,
        selectedDecade,
        selectedGenre,
        selectedCollection,
        collectionSlugMap,
        ttsLanguage,
        startRank,
        endRank,
        playbackMode,
        playIntro,
        playDetail,
        playArtistDescription,
        textIntro,
        textDetail,
        textArtistDescription,
        overdub,
        randomAllCategories,
        setStatus
    } = opts;

    setStatus('🎙️ Loading narration text...');
    await tick();

    try {
        const message = await loadPreview(modeType === 'collection' ? 'collection' : 'decade_genre', {
            decade: selectedDecade || '',
            genre: selectedGenre || '',
            collection: selectedCollection || '',
            collectionSlugMap,
            language: ttsLanguage,
            startRank,
            endRank
        });

        setStatus(message ?? '✅ Preview loaded.');

        const url = buildCarModeUrl({
            modeType,
            ttsLanguage,
            selectedDecade,
            selectedGenre,
            selectedCollection,
            collectionSlugMap,
            playIntro,
            playDetail,
            playArtistDescription,
            textIntro,
            textDetail,
            textArtistDescription,
            playTrack: true,
            startRank,
            endRank,
            playbackMode,
            overdub,
            randomAllCategories
        });

        console.log('🚗 Redirecting to Car Mode with URL:', url);

        const href = Array.isArray(url) ? url[0] : url;

        // eslint-disable-next-line svelte/no-navigation-without-resolve
        await goto(href, {replaceState: false});

        setStatus('🎧 Playback started!');
    } catch (err) {
        console.error('❌ Error during load sequence:', err);
        setStatus(
            err instanceof Error
                ? `❌ Error loading selection: ${err.message}`
                : '❌ Unknown error loading selection.'
        );
    }
}
