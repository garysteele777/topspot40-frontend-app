// src/lib/helpers/car/selectionFromUrl.ts
import type {SelectionState} from './types';
import type {PlaybackOrder} from './types';
import {normalizeLanguage} from '$lib/helpers/normalizeLanguage';
import {normalizeVoices} from '$lib/helpers/normalizeVoices';


export function buildSelectionFromUrl(url: URL): SelectionState {
    const sp = url.searchParams;

    const decade = sp.get('decade') ?? '';
    const genre = sp.get('genre') ?? '';
    const collection = sp.get('collection') ?? '';

    const language = normalizeLanguage(sp.get('language'));

    const startRank = Number(sp.get('startRank') ?? 1);

    // ✅ FORCE SINGLE if categoryMode is single or endRank missing
    const rawEndRank = sp.get('endRank');
    const endRank = rawEndRank != null ? Number(rawEndRank) : startRank; // ✅ default single-track

    const voices = normalizeVoices((sp.get('voices') ?? 'intro').split(','));


    const playbackOrder = (sp.get('playbackOrder') ?? 'up') as PlaybackOrder;
    const voicePlayMode = sp.get('voicePlayMode') === 'over' ? 'over' : 'before';
    const pauseMode = sp.get('pauseMode') === 'continuous' ? 'continuous' : 'pause';
    const skipPlayed = sp.get('skipPlayed') === 'true';


    const finalStartRank = startRank;
    const finalEndRank = startRank === endRank ? startRank : endRank;
    const currentRank = finalStartRank;
    const collectionCategory = sp.get('collectionCategory') ?? '';

    const programKey = sp.get('programKey');

    if (programKey) {
        const parts = programKey.split('|');

        if (parts[0] === 'DG') {
            return {
                programType: 'DG',
                mode: 'decade_genre',
                language,
                context: {
                    decade: parts[1] ?? '',
                    genre: parts[2] ?? ''
                },
                startRank: finalStartRank,
                endRank: finalEndRank,
                currentRank,
                playIntro: voices.includes('intro'),
                playDetail: voices.includes('detail'),
                playArtistDescription: voices.includes('artist'),
                textIntro: false,
                textDetail: false,
                textArtistDescription: false,
                voices,
                playbackOrder,
                voicePlayMode,
                pauseMode,
                categoryMode: 'single',
                skipPlayed
            };
        }

        if (parts[0] === 'COL') {
            return {
                programType: 'COL',
                mode: 'collection',
                language,
                context: {
                    collection_slug: parts[1] ?? '',
                    collection_group_slug: collectionCategory
                },
                startRank: finalStartRank,
                endRank: finalEndRank,
                currentRank,
                playIntro: voices.includes('intro'),
                playDetail: voices.includes('detail'),
                playArtistDescription: voices.includes('artist'),
                textIntro: false,
                textDetail: false,
                textArtistDescription: false,
                voices,
                playbackOrder,
                voicePlayMode,
                pauseMode,
                categoryMode: 'single',
                skipPlayed
            };
        }
    }


    if (collection) {
        return {
            programType: 'COL',
            mode: 'collection',
            language,
            context: {
                collection_slug: collection,
                collection_group_slug: collectionCategory
            },

            startRank: finalStartRank,
            endRank: finalEndRank,
            currentRank,
            playIntro: voices.includes('intro'),
            playDetail: voices.includes('detail'),
            playArtistDescription: voices.includes('artist'),
            textIntro: false,
            textDetail: false,
            textArtistDescription: false,
            voices,
            playbackOrder,
            voicePlayMode,
            pauseMode,
            categoryMode: 'single',
            skipPlayed
        };
    }

    return {
        programType: 'DG',
        mode: 'decade_genre',
        language,
        context: {decade, genre},
        startRank: finalStartRank,
        endRank: finalEndRank,
        currentRank,
        playIntro: voices.includes('intro'),
        playDetail: voices.includes('detail'),
        playArtistDescription: voices.includes('artist'),
        textIntro: false,
        textDetail: false,
        textArtistDescription: false,
        voices,
        playbackOrder,
        voicePlayMode,
        pauseMode,
        categoryMode: 'single',
        skipPlayed
    };
}
