import type {PlaybackPhase} from '$lib/helpers/car/types';

type CarModeLocale = 'en' | 'es' | 'ptbr';
type VisiblePlaybackPhase = Exclude<PlaybackPhase, 'idle' | 'stopped'>;

export type CarModePlaybackPhaseCopy = {
    meta: string;
};

const emptyCopy: CarModePlaybackPhaseCopy = {meta: ''};

const copy: Record<
    CarModeLocale,
    Partial<Record<VisiblePlaybackPhase, CarModePlaybackPhaseCopy>>
> = {
    en: {
        loading: {meta: 'Getting music ready…'},
        prelude: {meta: 'Program introduction'},
        set_intro: {meta: 'Program introduction'},
        collection_intro: {meta: 'Collection introduction'},
        liner: {meta: 'TopSpot40 message'},
        intro: {meta: 'Song introduction'},
        detail: {meta: 'About this song'},
        artist: {meta: 'About the artist'},
        track: {meta: 'Now playing'},
        paused: {meta: 'Paused'},
        ended: {meta: 'This program has ended'},
        music: {meta: 'Now playing'}
    },
    es: {
        loading: {meta: 'Preparando la música…'},
        prelude: {meta: 'Introducción al programa'},
        set_intro: {meta: 'Introducción del programa'},
        collection_intro: {meta: 'Introducción de la colección'},
        liner: {meta: 'Mensaje de TopSpot40'},
        intro: {meta: 'Introducción de la canción'},
        detail: {meta: 'Sobre esta canción'},
        artist: {meta: 'Sobre el artista'},
        track: {meta: 'Reproduciendo ahora'},
        paused: {meta: 'En pausa'},
        ended: {meta: 'Este programa ha terminado'},
        music: {meta: 'Reproduciendo ahora'}
    },
    ptbr: {
        loading: {meta: 'Preparando a música…'},
        prelude: {meta: 'Introdução do programa'},
        set_intro: {meta: 'Introdução do programa'},
        collection_intro: {meta: 'Introdução da coleção'},
        liner: {meta: 'Mensagem do TopSpot40'},
        intro: {meta: 'Introdução da música'},
        detail: {meta: 'Sobre esta música'},
        artist: {meta: 'Sobre o artista'},
        track: {meta: 'Tocando agora'},
        paused: {meta: 'Pausado'},
        ended: {meta: 'Este programa terminou'},
        music: {meta: 'Tocando agora'}
    }
};

function normalizeLocale(language: string | null | undefined): CarModeLocale {
    if (language === 'es') return 'es';
    if (language === 'ptbr' || language === 'pt-BR') return 'ptbr';
    return 'en';
}

export function getCarModePlaybackPhaseCopy(
    phase: unknown,
    language: string | null | undefined
): CarModePlaybackPhaseCopy {
    if (typeof phase !== 'string') return emptyCopy;

    return copy[normalizeLocale(language)][phase as VisiblePlaybackPhase] ?? emptyCopy;
}
