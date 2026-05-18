// src/lib/helpers/selectionLoader.ts

import {goto} from '$app/navigation';
import {selection} from '$lib/stores/selection';
import type {SelectionState} from '$lib/stores/selection';
import type {
    Language,
    ModeType,
    PauseMode,
    PlaybackOrder,
    VoicePart,
    VoicePlayMode
} from '$lib/types/playback';
import {normalizeLanguage} from '$lib/helpers/normalizeLanguage';

export async function loadSelection(
    opts: {
        modeType: ModeType;
        ttsLanguage: string;
        languages?: Language[];

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

        voices?: VoicePart[];
        playbackOrder?: PlaybackOrder;
        voicePlayMode?: VoicePlayMode;
        pauseMode?: PauseMode;
        skipPlayed?: boolean;
    },
    setStatus?: (msg: string) => void
): Promise<void> {
    const {
        modeType,
        ttsLanguage,
        languages,

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

        voices,
        playbackOrder = 'up',
        voicePlayMode = 'before',
        pauseMode = 'pause',
        skipPlayed = false
    } = opts;

    try {
        if (modeType === 'decade_genre' && (!selectedDecade || !selectedGenre)) {
            setStatus?.('⚠️ Please select both a Decade and a Genre.');
            return;
        }

        if (modeType === 'collection' && (!selectedCollection || selectedCollection === '')) {
            setStatus?.('⚠️ Please select a valid Collection.');
            return;
        }

        const language = normalizeLanguage(ttsLanguage);
        const selectedLanguages =
            languages?.length ? languages : [language];

        const selectedVoices =
            voices?.length
                ? voices
                : ([
                    playIntro && 'intro',
                    playDetail && 'detail',
                    playArtistDescription && 'artist'
                ].filter(Boolean) as VoicePart[]);

        let context: SelectionState['context'];

        if (modeType === 'collection') {
            const slug = collectionSlugMap[selectedCollection ?? ''] ?? '';

            context = {
                collection_slug: slug,
                collection_name: selectedCollection ?? ''
            };
        } else {
            context = {
                decade: selectedDecade ?? '',
                genre: selectedGenre ?? ''
            };
        }

        selection.set({
            programType: modeType === 'collection' ? 'COL' : 'DG',
            mode: modeType,

            language,
            languages: selectedLanguages,

            context,

            startRank,
            endRank,
            currentRank: startRank,

            playIntro,
            playDetail,
            playArtistDescription,

            textIntro,
            textDetail,
            textArtistDescription,

            voices: selectedVoices,
            playbackOrder,
            voicePlayMode,
            pauseMode,
            categoryMode: 'single',
            skipPlayed
        });

        const params = new URLSearchParams({
            mode: modeType,
            language,
            languages: selectedLanguages.join(','),

            startRank: String(startRank),
            endRank: String(endRank),

            voices: selectedVoices.join(','),

            playbackOrder,
            voicePlayMode,
            pauseMode,
            skipPlayed: String(skipPlayed)
        });

        if (modeType === 'collection') {
            params.set('collection', collectionSlugMap[selectedCollection ?? ''] ?? '');
        } else {
            params.set('decade', selectedDecade ?? '');
            params.set('genre', selectedGenre ?? '');
        }

        const url = `/car-page?${params.toString()}`;

        void goto(url);
    } catch (err) {
        console.error('❌ loadSelection failed:', err);
        setStatus?.('❌ Error loading selection.');
    }
}