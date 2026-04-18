// src/lib/helpers/car/selectionFromUrl.ts
import type {SelectionState} from './types';
import type {PlaybackOrder} from './types';
import {normalizeLanguage} from '$lib/helpers/normalizeLanguage';
import {normalizeVoices} from '$lib/helpers/normalizeVoices';

export function buildSelectionFromUrl(url: URL): SelectionState {
    const sp = url.searchParams;

    const programType = (sp.get('programType') ?? 'DG') as SelectionState['programType'];
    const modeParam = sp.get('mode');

    const decade = sp.get('decade') ?? '';
    const genre = sp.get('genre') ?? '';
    const collection = sp.get('collection') ?? '';
    const collectionGroup = sp.get('collection_group') ?? '';
    const favoritesGroup = sp.get('favoritesGroup') ?? '';

    const language = normalizeLanguage(sp.get('language'));

    const startRank = Number(sp.get('startRank') ?? 1);

    const rawEndRank = sp.get('endRank');
    const endRank = rawEndRank != null ? Number(rawEndRank) : startRank;

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

    // 🔥 Collections Radio from URL
    if (modeParam === 'radio_collections' || modeParam === 'collections') {
        const group = collectionGroup || 'ALL';

        return {
            programType: 'RADIO_COL',
            mode: 'collection',
            language,
            context: {
                collection_group_slug: group
            },
            startRank: finalStartRank,
            endRank: 9999,
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
        programType,
        mode: 'decade_genre',
        language,
        context: {
            decade,
            genre,
            favoritesType: programType === 'FAV_DG' ? 'DG' : '',
            favoritesGroup: programType === 'FAV_DG' ? favoritesGroup : ''
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