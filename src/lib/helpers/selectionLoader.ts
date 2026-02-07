// src/lib/helpers/selectionLoader.ts
import {goto} from '$app/navigation';
import {selection} from '$lib/stores/selection';
import type {Mode, SelectionState} from '$lib/stores/selection';
import {normalizeLanguage} from '$lib/helpers/normalizeLanguage';

export async function loadSelection(
    opts: {
        modeType: Mode;
        ttsLanguage: string;

        selectedDecade?: string;
        selectedGenre?: string;

        selectedCollection?: string;
        collectionSlugMap?: Record<string, string>;

        startRank: number;
        endRank: number;

        playIntro: boolean;
        playDetail: boolean;
        playArtistDescription: boolean;

        textIntro: boolean;
        textDetail: boolean;
        textArtistDescription: boolean;

        playTrack: boolean;
    },
    setStatus?: (msg: string) => void
): Promise<void> {
    const {
        modeType,
        ttsLanguage,
        selectedDecade,
        selectedGenre,
        selectedCollection,
        collectionSlugMap = {},

        startRank,
        endRank,

        playIntro,
        playDetail,
        playArtistDescription,

        textIntro,
        textDetail,
        textArtistDescription,

        playTrack,
    } = opts;

    try {
        // ───────── Validation ─────────
        if (modeType === 'decade_genre' && (!selectedDecade || !selectedGenre)) {
            setStatus?.('⚠️ Please select both a Decade and a Genre.');
            return;
        }
        if (modeType === 'collection' && (!selectedCollection || selectedCollection === '')) {
            setStatus?.('⚠️ Please select a valid Collection.');
            return;
        }

        // ───────── Build context ─────────
        let context: SelectionState['context'];

        if (modeType === 'collection') {
            const slug = collectionSlugMap[selectedCollection ?? ''] ?? '';

            context = {
                collection_slug: slug,
                collection_name: selectedCollection ?? '',
            };
        } else {
            context = {
                decade: selectedDecade ?? '',
                genre: selectedGenre ?? '',
            };
        }


        // ───────── Update global store (WITHOUT tracks) ─────────
        selection.set({
            mode: modeType,
            language: normalizeLanguage(ttsLanguage),

            context,

            startRank,
            endRank,
            currentRank: startRank,

            // Playback toggles
            playIntro,
            playDetail,
            playArtistDescription,

            // Text toggles
            textIntro,
            textDetail,
            textArtistDescription,

            // Defaults
            voices: ['intro'],
            playbackOrder: 'up',
            voicePlayMode: 'before',
            pauseMode: 'pause',
            categoryMode: 'single'
        });

        // ───────── Build query params ─────────
        const params = new URLSearchParams({
            mode: modeType,
            language: ttsLanguage,

            startRank: String(startRank),
            endRank: String(endRank),

            voices: [
                playIntro && 'intro',
                playDetail && 'detail',
                playArtistDescription && 'artist',
            ]
                .filter(Boolean)
                .join(','),

            playbackOrder: 'up',
            voicePlayMode: 'before',
            pauseMode: 'pause',
        });


        if (modeType === 'collection') {
            params.set('collection', collectionSlugMap[selectedCollection ?? ''] ?? '');

        } else {
            params.set('decade', selectedDecade ?? '');
            params.set('genre', selectedGenre ?? '');
        }

        const url = `/car-page?${params.toString()}`;
        console.log('🚗 Redirecting to Car Mode with URL:', url);

        // ───────── Navigation (Lint Safe) ─────────
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        void goto(url);

    } catch (err) {
        console.error('❌ loadSelection failed:', err);
        setStatus?.('❌ Error loading selection.');
    }
}
