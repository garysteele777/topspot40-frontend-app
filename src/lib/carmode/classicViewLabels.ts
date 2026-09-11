import type {Language} from '$lib/stores/selection';

type ClassicViewCopy = {
    carMode: string;
    of: string;
    driveInView: string;
};

export const classicViewCopy: Record<Language, ClassicViewCopy> = {
    en: {
        carMode: 'CAR MODE',
        of: 'of',
        driveInView: 'Drive-In View'
    },
    es: {
        carMode: 'MODO AUTO',
        of: 'de',
        driveInView: 'Vista autocine'
    },
    ptbr: {
        carMode: 'MODO CARRO',
        of: 'de',
        driveInView: 'Vista drive-in'
    }
};

export function formatClassicTrackPosition(
    current: number,
    total: number,
    language: Language
): string {
    return `${current} ${classicViewCopy[language].of} ${total}`;
}
