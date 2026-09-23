import type {Language} from '$lib/stores/selection';

export type NarrationActionCopy = {
    moreInfo: string;
    trackList: string;
    changeMusic: string;
};

export const narrationActionCopy: Record<Language, NarrationActionCopy> = {
    en: {
        moreInfo: 'More Info',
        trackList: 'Track List',
        changeMusic: 'Change Music'
    },
    es: {
        moreInfo: 'Más información',
        trackList: 'Lista de canciones',
        changeMusic: 'Cambiar música'
    },
    ptbr: {
        moreInfo: 'Mais informações',
        trackList: 'Lista de faixas',
        changeMusic: 'Mudar música'
    }
};
