import type {Language} from '$lib/stores/selection';

type ClassicViewCopy = {
    carMode: string;
    of: string;
    nowPlaying: string;
    track: string;
    carView: string;
    driveInView: string;
    playbackView: string;
};

export const classicViewCopy: Record<Language, ClassicViewCopy> = {
    en: {
        carMode: 'CAR MODE',
        of: 'of',
        nowPlaying: 'NOW PLAYING',
        track: 'Track',
        carView: 'Car View',
        driveInView: 'Drive-In View',
        playbackView: 'Playback view'
    },
    es: {
        carMode: 'MODO AUTO',
        of: 'de',
        nowPlaying: 'AHORA SUENA',
        track: 'Canción',
        carView: 'Vista del auto',
        driveInView: 'Vista autocine',
        playbackView: 'Vista de reproducción'
    },
    ptbr: {
        carMode: 'MODO CARRO',
        of: 'de',
        nowPlaying: 'TOCANDO AGORA',
        track: 'Faixa',
        carView: 'Vista do carro',
        driveInView: 'Vista drive-in',
        playbackView: 'Visualização de reprodução'
    }
};

export function formatClassicTrackPosition(
    current: number,
    total: number,
    language: Language
): string {
    return `${current} ${classicViewCopy[language].of} ${total}`;
}

export function formatDriveInTrackPosition(
    current: number,
    total: number,
    language: Language
): string {
    const copy = classicViewCopy[language];
    return `${copy.track} ${current} ${copy.of} ${total}`;
}
