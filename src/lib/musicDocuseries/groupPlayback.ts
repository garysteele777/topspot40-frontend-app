import type {MusicDocuseriesStory} from './types';
import type {DocuseriesHistory} from './history';
import type {Language} from '../types/playback';

export type DocuseriesGroupMode = 'all' | 'unheard';

export function buildDocuseriesQueue(stories: MusicDocuseriesStory[], mode: DocuseriesGroupMode, history: DocuseriesHistory) {
    return [...stories].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
        .filter(story => mode === 'all' || !history[story.slug]);
}

export function buildDocuseriesGroupUrl(collection: string, language: Language, mode: DocuseriesGroupMode): string {
    return `/story-player?${new URLSearchParams({type: 'music_docuseries', collection,
        language: language === 'ptbr' ? 'pt-BR' : language, group: mode,
        returnTo: `/journey-prototype/music-docuseries/${encodeURIComponent(collection)}`})}`;
}

export const docuseriesText = {
    en: {complete: 'Complete', progress: (n: number, total: number) => `${n} of ${total} complete`,
        playAll: 'Play All', playUnheard: 'Play Unheard', allComplete: 'All stories complete',
        introduction: 'Group introduction', next: 'Next Story', finished: 'Group finished',
        start: 'Start Group', play: 'Play Story', pause: 'Pause', resume: 'Resume', stop: 'Stop',
        back: 'Back', loading: 'Loading stories…', unavailable: 'This story is unavailable. You can retry or go to the next story.',
        blocked: 'Tap Play to continue listening.', upNext: 'Up next', story: 'Story', of: 'of',
        history: 'Docuseries History', clear: 'Clear Group History', confirmClear: 'Clear listening history for this group?',
        empty: 'No unheard stories remain.', showText: 'Show Story Text', hideText: 'Hide Story Text'},
    es: {complete: 'Completa', progress: (n: number, total: number) => `${n} de ${total} completas`,
        playAll: 'Reproducir todas', playUnheard: 'Reproducir no escuchadas', allComplete: 'Todas las historias completas',
        introduction: 'Introducción del grupo', next: 'Siguiente historia', finished: 'Grupo finalizado',
        start: 'Iniciar grupo', play: 'Reproducir historia', pause: 'Pausa', resume: 'Continuar', stop: 'Detener',
        back: 'Volver', loading: 'Cargando historias…', unavailable: 'Esta historia no está disponible. Puedes reintentar o pasar a la siguiente.',
        blocked: 'Pulsa Reproducir para continuar.', upNext: 'A continuación', story: 'Historia', of: 'de',
        history: 'Historial de docuseries', clear: 'Borrar historial del grupo', confirmClear: '¿Borrar el historial de escucha de este grupo?',
        empty: 'No quedan historias sin escuchar.', showText: 'Mostrar texto', hideText: 'Ocultar texto'},
    ptbr: {complete: 'Concluída', progress: (n: number, total: number) => `${n} de ${total} concluídas`,
        playAll: 'Reproduzir todas', playUnheard: 'Reproduzir não ouvidas', allComplete: 'Todas as histórias concluídas',
        introduction: 'Introdução do grupo', next: 'Próxima história', finished: 'Grupo finalizado',
        start: 'Iniciar grupo', play: 'Reproduzir história', pause: 'Pausar', resume: 'Continuar', stop: 'Parar',
        back: 'Voltar', loading: 'Carregando histórias…', unavailable: 'Esta história não está disponível. Você pode tentar novamente ou passar para a próxima.',
        blocked: 'Toque em Reproduzir para continuar.', upNext: 'A seguir', story: 'História', of: 'de',
        history: 'Histórico de docusséries', clear: 'Limpar histórico do grupo', confirmClear: 'Limpar o histórico de escuta deste grupo?',
        empty: 'Não há histórias não ouvidas restantes.', showText: 'Mostrar texto', hideText: 'Ocultar texto'}
};
