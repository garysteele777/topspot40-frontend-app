// User-facing copy only. Keep stored playback values language-independent.
const english = {
    title: 'TopSpot40 Playback Preferences',
    description: 'Choose how TopSpot40 sounds and plays your music.',
    back: 'Back', languages: 'Languages', voice: 'Voice', playback: 'Playback',
    narrationLanguages: 'Narration Languages',
    selectLanguage: 'Select one narration language.',
    voiceContent: 'Voice Content', radio: 'Radio', dj: 'DJ', story: 'Story',
    intro: 'Intro', detail: 'Detail', artist: 'Artist', trackOnly: 'Track Only',
    detailLength: 'Detail length', off: 'Off', short: 'Short', long: 'Long',
    method: 'Method', automaticSpotify: 'Automatic Spotify', guidedSpotify: 'Guided Spotify',
    order: 'Order', up: 'Up', down: 'Down', shuffle: 'Shuffle', tracks: 'Tracks',
    favorNew: 'Favor New', allEqual: 'All Equal', flow: 'Flow',
    pause: 'Pause', continuous: 'Continuous'
};

type PreferencesCopy = typeof english;

const spanish: PreferencesCopy = {
    title: 'Preferencias de reproducción de TopSpot40',
    description: 'Elige cómo TopSpot40 narra y reproduce tu música.',
    back: 'Volver', languages: 'Idiomas', voice: 'Narración', playback: 'Reproducción',
    narrationLanguages: 'Idioma de narración',
    selectLanguage: 'Selecciona un idioma para la narración.',
    voiceContent: 'Contenido de narración', radio: 'Radio', dj: 'DJ', story: 'Historia',
    intro: 'Introducción', detail: 'Detalle', artist: 'Artista', trackOnly: 'Solo música',
    detailLength: 'Duración del detalle', off: 'Desactivado', short: 'Corto', long: 'Largo',
    method: 'Método', automaticSpotify: 'Spotify automático', guidedSpotify: 'Spotify guiado',
    order: 'Orden', up: 'Ascendente', down: 'Descendente', shuffle: 'Aleatorio', tracks: 'Canciones',
    favorNew: 'Omitir reproducidas', allEqual: 'Todas por igual', flow: 'Entre canciones',
    pause: 'Pausa', continuous: 'Continuo'
};

const portuguese: PreferencesCopy = {
    title: 'Preferências de reprodução do TopSpot40',
    description: 'Escolha como o TopSpot40 narra e reproduz suas músicas.',
    back: 'Voltar', languages: 'Idiomas', voice: 'Narração', playback: 'Reprodução',
    narrationLanguages: 'Idioma da narração',
    selectLanguage: 'Selecione um idioma para a narração.',
    voiceContent: 'Conteúdo da narração', radio: 'Rádio', dj: 'DJ', story: 'História',
    intro: 'Introdução', detail: 'Detalhe', artist: 'Artista', trackOnly: 'Só música',
    detailLength: 'Duração dos detalhes', off: 'Desativado', short: 'Curto', long: 'Longo',
    method: 'Método', automaticSpotify: 'Spotify automático', guidedSpotify: 'Spotify guiado',
    order: 'Ordem', up: 'Crescente', down: 'Decrescente', shuffle: 'Aleatório', tracks: 'Faixas',
    favorNew: 'Pular já ouvidas', allEqual: 'Todas iguais', flow: 'Entre faixas',
    pause: 'Pausa', continuous: 'Contínuo'
};

export function getPlaybackPreferencesCopy(language: string): PreferencesCopy {
    const normalized = language.toLowerCase().replace(/[-_]/g, '');
    if (normalized === 'es') return spanish;
    if (normalized === 'ptbr' || normalized === 'pt') return portuguese;
    return english;
}
