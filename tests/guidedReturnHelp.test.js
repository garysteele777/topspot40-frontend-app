// @ts-nocheck -- Node test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const panel = readFileSync(
    new URL('../src/lib/components/car/GuidedPlaybackPanel.svelte', import.meta.url),
    'utf8'
);

test('guided return help always displays complete instructions without a stored preference', () => {
    assert.doesNotMatch(panel, /localStorage|sessionStorage|RETURN_HELP_STORAGE_KEY|showDetailedReturnHelp/);
    assert.doesNotMatch(panel, /short reminder|Show step-by-step help/i);
});

test('guided return help contains the exact English core and device-specific copy', () => {
    const panelText = panel;

    for (const copy of [
        'Before you open Spotify',
        'Select “Open this song in Spotify,” then press Play in Spotify.',
        'Listen to this song. When it ends, immediately pause Spotify before the next queued song starts.',
        'Return to this TopSpot40 page and select “Continue the program.”',
        'Important: Spotify may automatically start the next queued song if you do not pause it.',
        'Want to move on early?', 'Pause Spotify and return to TopSpot40 whenever you’re ready to continue.',
        'How to get back to TopSpot40',
        'Tap the Recent Apps button (||| or square), then tap Chrome or TopSpot40.',
        'Swipe up from the bottom and hold, then tap Safari, Chrome, or TopSpot40. On an older iPhone, double-press the Home button.',
        'Pause Spotify, then return to the TopSpot40 browser tab. If the Spotify app opened, select your browser from the Windows taskbar or Mac Dock.',
        'What would you like to do?',
        'Let TopSpot40 choose the next track', 'TopSpot40 chooses the track and begins its introduction.',
        'Choose the next track yourself', 'Open the track list. Nothing plays until you select a track.',
        'Return to Car Mode and wait', 'Nothing plays until you choose what to do.',
        'Play this song again in Spotify', 'Reopen the current song in Spotify.'
    ]) {
        assert.ok(panelText.includes(copy));
    }
});

test('guided return help detects and permits manual Android, iPhone, and Computer selection', () => {
    assert.match(panel, /\/iphone\|ipad\|ipod\/\.test\(userAgent\)/);
    assert.match(panel, /\/android\/\.test\(userAgent\)/);
    assert.match(panel, /\['android', 'Android'\]/);
    assert.match(panel, /\['ios', 'iPhone'\]/);
    assert.match(panel, /\['computer', text\.computer\]/);
    assert.match(panel, /device = value as DeviceType/);
    assert.match(panel, /aria-pressed=\{device === value\}/);
    assert.match(panel, /aria-label=\{text\.chooseDevice\}/);
});

test('the Guided Playback report control has a localized panel-specific label', () => {
    assert.match(panel, /buttonLabel=\{text\.report\}/);
    assert.equal((panel.match(/<ReportProblemButton/g) ?? []).length, 3);
    assert.equal((panel.match(/Having trouble\? Report a problem/g) ?? []).length, 1);
    assert.equal((panel.match(/¿Tienes problemas\? Informa de un problema/g) ?? []).length, 1);
    assert.equal((panel.match(/Está com problemas\? Informe um problema/g) ?? []).length, 1);
});

test('only the explicit pre-Spotify button can launch Spotify and the background has no activation handler', () => {
    const preSpotify = panel.slice(
        panel.indexOf('{#if !opened}'),
        panel.indexOf('{:else if returned}')
    );
    const help = panel.slice(
        panel.indexOf('class="return-help pre-spotify-return-help"'),
        panel.indexOf('class="spotify-button"')
    );
    assert.match(help, /on:pointerdown\|stopPropagation/);
    assert.match(help, /on:pointerup\|stopPropagation/);
    assert.match(help, /on:click\|stopPropagation/);
    assert.match(preSpotify, /\{text\.openSong\}/);
    assert.equal((preSpotify.match(/on:click=\{openSpotify\}/g) ?? []).length, 1);
    assert.doesNotMatch(panel, /createBroadActivation|primary-spotify-area|on:pointerdown=\{handlePrimaryPointerDown\}|on:keydown=\{handlePrimaryKeydown\}/);
});

test('the return screen offers explicit next actions and a state-neutral Spotify reopen action', () => {
    const returned = panel.slice(
        panel.indexOf('{:else if returned}'),
        panel.indexOf('{:else}', panel.indexOf('{:else if returned}'))
    );

    assert.match(returned, /\{text\.welcome\}/);
    assert.match(returned, /\{text\.beforeContinuing\}/);
    assert.match(returned, /\{text\.pauseWarning\}/);
    assert.match(returned, /\{text\.whatNext\}/);
    assert.match(returned, /\{text\.continueProgram\}/);
    assert.match(returned, /\{text\.chooseNextTrack\}/);
    assert.match(returned, /\{text\.returnToCar\}/);
    assert.match(returned, /runReturnAction\(onContinue\)/);
    assert.match(returned, /runReturnAction\(onChooseNextTrack\)/);
    assert.match(returned, /runReturnAction\(onReturnToCarMode\)/);
    assert.match(returned, /\{text\.reopenSong\}[\s\S]*on:click=\{openSpotify\}|on:click=\{openSpotify\}[\s\S]*\{text\.reopenSong\}/);
    assert.match(returned, /\{text\.reopenSongHelp\}/);
    assert.doesNotMatch(returned, /skip-button|text\.skip|onSkip/);
    assert.match(returned, /class="next-action spotify-next-action"/);
    assert.match(panel, /\.spotify-next-action \.recovery-spotify-button \{[\s\S]*width: 100%;[\s\S]*min-height: 54px;[\s\S]*background: #1db954;/);
});

test('reopening Spotify delegates only to the existing current-track Spotify handler', () => {
    const page = readFileSync(
        new URL('../src/routes/car-page/+page.svelte', import.meta.url),
        'utf8'
    );

    assert.match(panel, /function openSpotify\(\): void \{[\s\S]*onOpenSpotify\(\);[\s\S]*\}/);
    assert.match(page, /function openGuidedSpotify\(\) \{[\s\S]*const track = get\(currentTrack\);[\s\S]*spotify\.open\(track\);[\s\S]*\}/);
    assert.match(page, /onOpenSpotify=\{openGuidedSpotify\}/);
    const reopenAction = panel.slice(
        panel.indexOf('class="next-action spotify-next-action"'),
        panel.indexOf('</section>', panel.indexOf('class="next-action spotify-next-action"'))
    );
    assert.match(reopenAction, /on:click=\{openSpotify\}/);
    assert.doesNotMatch(reopenAction, /completeCurrentTrack|nextTrack|playTrack|signalTrackFinishedApi|runReturnAction/);
});

test('guided playback state conditions and post-Spotify states remain unchanged', () => {
    assert.match(panel, /\{#if !opened\}/);
    assert.match(panel, /\{:\s*else if returned\}/);
    assert.match(panel, /SPOTIFY OPENED/);
    assert.match(panel, /When it finishes, swipe up and pause,/);
    assert.match(panel, /When it finishes, open Recent Apps/);
    assert.match(panel, /When it finishes, return to this/);
});

test('guided return help contains the exact Spanish pre-Spotify, device, and return copy', () => {
    const panelText = panel;
    for (const copy of [
        'Reproducción guiada', 'Narración completada', '¿Listo para escuchar la canción?',
        'Antes de abrir Spotify', 'Selecciona «Abrir esta canción en Spotify» y luego pulsa Reproducir en Spotify.',
        'Escucha la canción. Cuando termine, pausa Spotify inmediatamente antes de que empiece la siguiente canción en la cola.',
        'Regresa a esta página de TopSpot40 y selecciona «Continuar el programa».',
        'Importante: Spotify puede reproducir automáticamente la siguiente canción en la cola si no lo pausas.',
        '¿Quieres avanzar antes?', 'Pausa Spotify y regresa a TopSpot40 cuando quieras continuar.',
        'Cómo volver a TopSpot40', 'Toca el botón Aplicaciones recientes (||| o cuadrado) y luego toca Chrome o TopSpot40.',
        'Desliza hacia arriba desde la parte inferior y mantén pulsado; luego toca Safari, Chrome o TopSpot40. En un iPhone antiguo, pulsa dos veces el botón de inicio.',
        'Pausa Spotify y vuelve a la pestaña de TopSpot40 en el navegador. Si se abrió la aplicación de Spotify, selecciona el navegador desde la barra de tareas de Windows o el Dock de Mac.',
        'Abrir esta canción en Spotify', 'Ya estás de vuelta', 'Antes de continuar',
        'Pausa Spotify si no quieres que reproduzca otra canción de la cola. Spotify puede seguir reproduciéndose en segundo plano hasta que lo pauses.',
        '¿Qué te gustaría hacer?',
        'Dejar que TopSpot40 elija la siguiente canción', 'TopSpot40 elige la canción y comienza su introducción.',
        'Elegir tú la siguiente canción', 'Abre la lista de canciones. No se reproduce nada hasta que selecciones una canción.',
        'Volver al Modo Auto y esperar', 'No se reproduce nada hasta que elijas qué hacer.',
        'Reproducir esta canción otra vez en Spotify', 'Vuelve a abrir la canción actual en Spotify.', 'La canción no se reprodujo — Omitir'
    ]) assert.ok(panelText.includes(copy), copy);
});

test('guided return help contains the exact PT-BR pre-Spotify, device, and return copy', () => {
    const panelText = panel;
    for (const copy of [
        'Reprodução guiada', 'Narração concluída', 'Pronto para ouvir a música?',
        'Antes de abrir o Spotify', 'Selecione “Abrir esta música no Spotify” e depois pressione Reproduzir no Spotify.',
        'Ouça a música. Quando ela terminar, pause o Spotify imediatamente, antes que a próxima música da fila comece.',
        'Volte a esta página do TopSpot40 e selecione “Continuar o programa”.',
        'Importante: O Spotify pode iniciar automaticamente a próxima música da fila se você não pausá-lo.',
        'Quer avançar antes?', 'Pause o Spotify e volte ao TopSpot40 quando quiser continuar.',
        'Como voltar ao TopSpot40', 'Toque no botão Apps recentes (||| ou quadrado) e depois toque em Chrome ou TopSpot40.',
        'Deslize para cima a partir da parte inferior e segure; depois toque em Safari, Chrome ou TopSpot40. Em um iPhone antigo, pressione duas vezes o botão de Início.',
        'Pause o Spotify e volte à aba do TopSpot40 no navegador. Se o aplicativo do Spotify for aberto, selecione o navegador na barra de tarefas do Windows ou no Dock do Mac.',
        'Abrir esta música no Spotify', 'Você voltou', 'Antes de continuar',
        'Pause o Spotify se não quiser que ele reproduza outra música da fila. O Spotify pode continuar tocando em segundo plano até que você o pause.',
        'O que você gostaria de fazer?',
        'Deixar o TopSpot40 escolher a próxima música', 'O TopSpot40 escolhe a música e inicia a introdução.',
        'Escolher você mesmo a próxima música', 'Abra a lista de faixas. Nada tocará até você selecionar uma música.',
        'Voltar ao Modo Carro e aguardar', 'Nada tocará até você escolher o que fazer.',
        'Tocar esta música novamente no Spotify', 'Reabra a música atual no Spotify.', 'A música não tocou — Pular'
    ]) assert.ok(panelText.includes(copy), copy);
});

test('localized Guided Playback states use one shared copy map and retain narrow-screen scrolling', () => {
    assert.match(panel, /\$: copyLanguage = language === 'es'/);
    assert.match(panel, /language === 'ptbr' \|\| language === 'pt-BR'/);
    assert.match(panel, /\$: text = copy\[copyLanguage\]/);
    assert.match(panel, /\{text\.mode\}[\s\S]*\{text\.narrationComplete\}[\s\S]*\{text\.ready\}/);
    assert.match(panel, /overflow-y: auto/);
    assert.match(panel, /@media \(max-width: 480px\)[\s\S]*place-items: start center/);
});
