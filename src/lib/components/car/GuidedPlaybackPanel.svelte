<script lang="ts">
    import {onMount} from 'svelte';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import ReportProblemButton from './ReportProblemButton.svelte';

    export let track: CarModeTrack;
    export let opened = false;
    export let returned = false;
    export let onOpenSpotify: () => void;
    export let onContinue: () => void;
    export let onSkip: () => void;
    export let onBackToCar: () => void;
    export let language = 'en';
    export let onReportProblem: (() => void) | undefined;

    type DeviceType = 'ios' | 'android' | 'computer';
    type CopyLanguage = 'en' | 'es' | 'ptbr';

    const copy: Record<CopyLanguage, Record<string, string>> = {
        en: {
            mode: 'GUIDED PLAYBACK', narrationComplete: 'NARRATION COMPLETE', ready: 'Ready to hear the song?',
            beforeSpotify: 'Before you open Spotify', stepOne: 'Select “Open this song in Spotify,” then press Play in Spotify.',
            stepTwo: 'Listen to this song. When it ends, immediately pause Spotify before the next queued song starts.',
            stepThree: 'Return to this TopSpot40 page and select “Spotify is paused — Continue.”',
            warning: 'Important: Spotify may automatically start the next queued song if you do not pause it.',
            optionalLead: 'Want to move on early?', optional: 'Pause Spotify and return to TopSpot40 whenever you’re ready to continue.',
            returnHeading: 'How to get back to TopSpot40', chooseDevice: 'Choose your device', computer: 'Computer',
            androidHelp: 'Tap the Recent Apps button (||| or square), then tap Chrome or TopSpot40.',
            iosHelp: 'Swipe up from the bottom and hold, then tap Safari, Chrome, or TopSpot40. On an older iPhone, double-press the Home button.',
            computerHelp: 'Pause Spotify, then return to the TopSpot40 browser tab. If the Spotify app opened, select your browser from the Windows taskbar or Mac Dock.',
            openSong: 'Open this song in Spotify', welcome: 'Welcome back', pausedQuestion: 'Is Spotify paused?',
            pausedHelp: 'Pause Spotify before continuing so another song does not play. You can return at any time—you do not have to finish the song.',
            continue: 'Spotify is paused — Continue', openAgain: 'Open Spotify Again', skip: 'Song did not play — Skip',
            report: 'Having trouble? Report a problem', back: '← BACK TO CAR PAGE / CHOOSE A TRACK',
            safety: 'For safety, make selections only while parked or let a passenger operate the phone.',
            spotifyOpened: 'SPOTIFY OPENED', playInSpotify: 'Play the song in Spotify',
            compactIos: 'When it finishes, swipe up and pause, then return to TopSpot40, Safari, or Chrome.',
            compactAndroid: 'When it finishes, open Recent Apps and return to TopSpot40 or Chrome.',
            compactComputer: 'When it finishes, return to this TopSpot40 window.'
        },
        es: {
            mode: 'Reproducción guiada', narrationComplete: 'Narración completada', ready: '¿Listo para escuchar la canción?',
            beforeSpotify: 'Antes de abrir Spotify', stepOne: 'Selecciona «Abrir esta canción en Spotify» y luego pulsa Reproducir en Spotify.',
            stepTwo: 'Escucha la canción. Cuando termine, pausa Spotify inmediatamente antes de que empiece la siguiente canción en la cola.',
            stepThree: 'Regresa a esta página de TopSpot40 y selecciona «Spotify está en pausa — Continuar».',
            warning: 'Importante: Spotify puede reproducir automáticamente la siguiente canción en la cola si no lo pausas.',
            optionalLead: '¿Quieres avanzar antes?', optional: 'Pausa Spotify y regresa a TopSpot40 cuando quieras continuar.',
            returnHeading: 'Cómo volver a TopSpot40', chooseDevice: 'Elige tu dispositivo', computer: 'Computadora',
            androidHelp: 'Toca el botón Aplicaciones recientes (||| o cuadrado) y luego toca Chrome o TopSpot40.',
            iosHelp: 'Desliza hacia arriba desde la parte inferior y mantén pulsado; luego toca Safari, Chrome o TopSpot40. En un iPhone antiguo, pulsa dos veces el botón de inicio.',
            computerHelp: 'Pausa Spotify y vuelve a la pestaña de TopSpot40 en el navegador. Si se abrió la aplicación de Spotify, selecciona el navegador desde la barra de tareas de Windows o el Dock de Mac.',
            openSong: 'Abrir esta canción en Spotify', welcome: 'Ya estás de vuelta', pausedQuestion: '¿Spotify está en pausa?',
            pausedHelp: 'Pausa Spotify antes de continuar para evitar que se reproduzca otra canción. Puedes regresar en cualquier momento; no tienes que terminar la canción.',
            continue: 'Spotify está en pausa — Continuar', openAgain: 'Abrir Spotify de nuevo', skip: 'La canción no se reprodujo — Omitir',
            report: '¿Tienes problemas? Informa de un problema', back: '← VOLVER A LA PÁGINA DEL AUTO / ELEGIR UNA CANCIÓN',
            safety: 'Por seguridad, haz las selecciones solo cuando estés estacionado o deja que un pasajero use el teléfono.',
            spotifyOpened: 'SPOTIFY ABIERTO', playInSpotify: 'Reproduce la canción en Spotify',
            compactIos: 'Cuando termine, desliza hacia arriba, pausa y vuelve a TopSpot40, Safari o Chrome.',
            compactAndroid: 'Cuando termine, abre Aplicaciones recientes y vuelve a TopSpot40 o Chrome.',
            compactComputer: 'Cuando termine, vuelve a esta ventana de TopSpot40.'
        },
        ptbr: {
            mode: 'Reprodução guiada', narrationComplete: 'Narração concluída', ready: 'Pronto para ouvir a música?',
            beforeSpotify: 'Antes de abrir o Spotify', stepOne: 'Selecione “Abrir esta música no Spotify” e depois pressione Reproduzir no Spotify.',
            stepTwo: 'Ouça a música. Quando ela terminar, pause o Spotify imediatamente, antes que a próxima música da fila comece.',
            stepThree: 'Volte a esta página do TopSpot40 e selecione “Spotify pausado — Continuar”.',
            warning: 'Importante: O Spotify pode iniciar automaticamente a próxima música da fila se você não pausá-lo.',
            optionalLead: 'Quer avançar antes?', optional: 'Pause o Spotify e volte ao TopSpot40 quando quiser continuar.',
            returnHeading: 'Como voltar ao TopSpot40', chooseDevice: 'Escolha seu dispositivo', computer: 'Computador',
            androidHelp: 'Toque no botão Apps recentes (||| ou quadrado) e depois toque em Chrome ou TopSpot40.',
            iosHelp: 'Deslize para cima a partir da parte inferior e segure; depois toque em Safari, Chrome ou TopSpot40. Em um iPhone antigo, pressione duas vezes o botão de Início.',
            computerHelp: 'Pause o Spotify e volte à aba do TopSpot40 no navegador. Se o aplicativo do Spotify for aberto, selecione o navegador na barra de tarefas do Windows ou no Dock do Mac.',
            openSong: 'Abrir esta música no Spotify', welcome: 'Você voltou', pausedQuestion: 'O Spotify está pausado?',
            pausedHelp: 'Pause o Spotify antes de continuar para evitar que outra música seja reproduzida. Você pode voltar a qualquer momento; não precisa ouvir a música até o fim.',
            continue: 'Spotify pausado — Continuar', openAgain: 'Abrir o Spotify novamente', skip: 'A música não tocou — Pular',
            report: 'Está com problemas? Informe um problema', back: '← VOLTAR À PÁGINA DO CARRO / ESCOLHER UMA MÚSICA',
            safety: 'Por segurança, faça as seleções apenas quando estiver estacionado ou deixe um passageiro operar o telefone.',
            spotifyOpened: 'SPOTIFY ABERTO', playInSpotify: 'Reproduza a música no Spotify',
            compactIos: 'Quando terminar, deslize para cima, pause e volte ao TopSpot40, Safari ou Chrome.',
            compactAndroid: 'Quando terminar, abra Apps recentes e volte ao TopSpot40 ou Chrome.',
            compactComputer: 'Quando terminar, volte a esta janela do TopSpot40.'
        }
    };

    let device: DeviceType = 'computer';
    let spotifyActivated = false;
    let copyLanguage: CopyLanguage = 'en';
    $: copyLanguage = language === 'es'
        ? 'es'
        : language === 'ptbr' || language === 'pt-BR'
            ? 'ptbr'
            : 'en';
    $: text = copy[copyLanguage];

    function openSpotify(): void {
        spotifyActivated = true;
        onOpenSpotify();
    }

    function displayTrackName(
        value: string
    ): string {
        const trimmed = value.trim();

        if (
            !trimmed
            || trimmed !== trimmed.toLocaleLowerCase()
        ) {
            return trimmed;
        }

        return trimmed.replace(
            /(^|[\s([{'"-])(\p{L})/gu,
            (_match, prefix, letter) =>
                `${prefix}${letter.toLocaleUpperCase()}`
        );
    }

    function detectDevice(): DeviceType {
        const userAgent =
            navigator.userAgent.toLowerCase();

        const isIPadOS =
            navigator.platform === 'MacIntel'
            && navigator.maxTouchPoints > 1;

        if (
            /iphone|ipad|ipod/.test(userAgent)
            || isIPadOS
        ) {
            return 'ios';
        }

        if (/android/.test(userAgent)) {
            return 'android';
        }

        return 'computer';
    }

    onMount(() => {
        device = detectDevice();
    });
</script>

<div
        class="guided-overlay"
        class:spotifyActivated
        role="dialog"
        tabindex="0"
        aria-modal="true"
        aria-labelledby="guided-heading"
>
    <section class="guided-card" aria-live="polite">
        <div class="mode-label">
            {text.mode}
        </div>

        {#if !opened}
            <div class="state-label">
                {text.narrationComplete}
            </div>

            <h2 id="guided-heading">
                {text.ready}
            </h2>

            <div class="track-name">
                {displayTrackName(track.trackName)}
            </div>

            <div class="artist-name">
                {displayTrackName(track.artistName)}
            </div>

            <section
                    class="return-help pre-spotify-return-help"
                    aria-labelledby="return-help-heading"
            >
                <h3 id="return-help-heading">
                    {text.beforeSpotify}
                </h3>

                <ol class="return-help-steps">
                    <li>
                        {text.stepOne}
                    </li>
                    <li>
                        {text.stepTwo}
                    </li>
                    <li>
                        {text.stepThree}
                    </li>
                </ol>

                <p class="return-help-warning">
                    {text.warning}
                </p>

                <p class="return-help-optional">
                    <strong>{text.optionalLead}</strong> {text.optional}
                </p>

                <h3 class="device-help-heading">
                    {text.returnHeading}
                </h3>

                <div
                        class="device-selector"
                        role="group"
                        aria-label={text.chooseDevice}
                >
                    {#each [
                        ['android', 'Android'],
                        ['ios', 'iPhone'],
                        ['computer', text.computer]
                    ] as [value, label]}
                        <button
                                type="button"
                                class:active-device={device === value}
                                aria-pressed={device === value}
                                on:pointerdown|stopPropagation
                                on:pointerup|stopPropagation
                                on:pointercancel|stopPropagation
                                on:click|stopPropagation={() => {
                                    device = value as DeviceType;
                                }}
                        >
                            {label}
                        </button>
                    {/each}
                </div>

                <div class="device-instruction" aria-live="polite">
                    {#if device === 'android'}
                        {text.androidHelp}
                    {:else if device === 'ios'}
                        {text.iosHelp}
                    {:else}
                        {text.computerHelp}
                    {/if}
                </div>
            </section>

            <button
                    type="button"
                    class="spotify-button"
                    on:click={openSpotify}
            >
                {text.openSong}
            </button>


            <button
                    class="back-button"
                    on:pointerdown|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                    on:click={onBackToCar}
            >
                {text.back}
            </button>
            <ReportProblemButton
                    {language}
                    buttonLabel={text.report}
                    onReport={() => onReportProblem?.()}
            />

            <p class="safety-note">
                {text.safety}
            </p>
        {:else if returned}
            <h2 id="guided-heading">
                {text.welcome}
            </h2>

            <div class="track-name">
                {displayTrackName(track.trackName)}
            </div>

            <div class="artist-name">
                {displayTrackName(track.artistName)}
            </div>

            <p class="return-question">
                {text.pausedQuestion}
            </p>

            <p class="bio-instruction">
                {text.pausedHelp}
            </p>

            <button
                    type="button"
                    class="continue-button"
                    on:click={onContinue}
            >
                {text.continue}
            </button>


            <button
                    class="back-button"
                    on:pointerdown|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                    on:click={onBackToCar}
            >
                {text.back}
            </button>

            <button
                    class="recovery-spotify-button"
                    on:pointerdown|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                    on:click={openSpotify}
            >
                {text.openAgain}
            </button>
            <button
                    type="button"
                    class="skip-button"
                    on:click={onSkip}
            >
                {text.skip}
            </button>
            <ReportProblemButton
                    {language}
                    buttonLabel={text.report}
                    onReport={() => onReportProblem?.()}
            />

            <p class="safety-note">
                {text.safety}
            </p>
        {:else}
            <div class="state-label">
                {text.spotifyOpened}
            </div>

            <h2 id="guided-heading">
                {text.playInSpotify}
            </h2>

            <div class="track-name">
                {displayTrackName(track.trackName)}
            </div>

            <div class="artist-name">
                {track.artistName}
            </div>

            <div class="return-help compact">
                {#if device === 'ios'}
                    <p>
                        {text.compactIos}
                    </p>
                {:else if device === 'android'}
                    <p>
                        {text.compactAndroid}
                    </p>
                {:else}
                    <p>
                        {text.compactComputer}
                    </p>
                {/if}
            </div>

            <button
                    class="continue-button"
                    on:click={onContinue}
            >
                {text.continue}
            </button>

            <div class="secondary-actions">
                <button on:click={openSpotify}>
                    {text.openAgain}
                </button>

                <button on:click={onSkip}>
                    {text.skip}
                </button>
            </div>
            <ReportProblemButton
                    {language}
                    buttonLabel={text.report}
                    onReport={() => onReportProblem?.()}
            />
        {/if}
    </section>
</div>

<style>
    .guided-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        overflow-y: auto;
        padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
        background: rgba(5, 5, 7, 0.92);
        backdrop-filter: blur(8px);
    }

    .guided-card {
        width: min(600px, 100%);
        padding: clamp(20px, 5vw, 34px);
        text-align: center;
        border: 1px solid rgba(29, 185, 84, 0.75);
        border-radius: 22px;
        background: #121212;
        box-shadow: 0 18px 55px rgba(0, 0, 0, 0.7);
    }

    .mode-label {
        margin-bottom: 8px;
        color: #1db954;
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.14em;
    }

    .state-label {
        margin-bottom: 8px;
        color: #cfb87c;
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.1em;
    }

    h2 {
        margin: 0 0 14px;
        color: #fff;
        font-size: clamp(1.55rem, 6vw, 2.25rem);
    }

    .track-name {
        color: #cfb87c;
        font-size: clamp(1.25rem, 5vw, 1.65rem);
        font-weight: 900;
    }

    .artist-name {
        margin-top: 5px;
        color: #eee;
        font-size: 1.08rem;
    }

    .return-help {
        margin: 18px 0;
        padding: 15px;
        border-radius: 14px;
        color: #ddd;
        background: #202024;
    }

    .return-help p {
        margin: 8px 0 0;
        line-height: 1.45;
    }

    .pre-spotify-return-help {
        margin: 22px 0 14px;
        text-align: left;
    }

    .pre-spotify-return-help h3 {
        margin: 0;
        color: #fff;
        font-size: 1.1rem;
    }

    .return-help-steps {
        display: grid;
        gap: 8px;
        margin: 14px 0;
        padding-left: 1.35rem;
    }

    .return-help-warning {
        color: #ffe29a;
        font-weight: 800;
    }

    .return-help-optional {
        margin-top: 10px;
        color: #c6c6c6;
        font-size: 0.92rem;
        line-height: 1.45;
    }

    .return-help-optional strong {
        color: #e7e7e7;
        font-weight: 800;
    }

    .device-selector {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-top: 16px;
    }

    .device-selector button {
        min-height: 42px;
        padding: 8px 10px;
        border: 1px solid #5b6978;
        border-radius: 10px;
        color: #dcecff;
        background: #292f36;
    }

    .device-selector button.active-device {
        border-color: #75ef4f;
        color: #111;
        background: #75ef4f;
    }

    .device-instruction {
        min-height: 3.1em;
        margin-top: 12px;
        color: #fff;
        line-height: 1.45;
    }

    .device-selector button:focus-visible,
    .spotify-button:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 3px;
    }

    .device-help-heading {
        margin-top: 22px !important;
    }

    .return-help.compact {
        margin-top: 22px;
    }

    button {
        cursor: pointer;
        border: 0;
        font: inherit;
        font-weight: 800;
    }

    .spotifyActivated .guided-card {
        border-color: #38d873;
        box-shadow: 0 18px 55px rgba(29, 185, 84, 0.32);
    }

    .spotify-button {
        width: 100%;
        min-height: 62px;
        margin: 20px 0 12px;
        padding: 14px 18px;
        border-radius: 999px;
        color: #111;
        font-size: 1.05rem;
        font-weight: 800;
        background: #1db954;
    }


    .bio-instruction {
        margin: 20px 0 10px;
        color: #ddd;
        font-size: 0.95rem;
    }

    .return-question {
        margin: 22px 0 0;
        color: #fff;
        font-size: 1.3rem;
        font-weight: 900;
    }

    .continue-button {
        width: 100%;
        min-height: 62px;
        padding: 14px 18px;
        border-radius: 999px;
        color: #fff;
        font-size: 1.05rem;
        background: #1db954;
    }

    .continue-button {
        margin-top: 24px;
        color: #111;
        background: #cfb87c;
    }

    .recovery-spotify-button {
        width: auto;
        min-height: 40px;
        margin-top: 12px;
        padding: 8px 14px;
        border: 1px solid #4d765b;
        border-radius: 999px;
        color: #b9f5cc;
        font-size: 0.84rem;
        background: #1b2b20;
    }

    .skip-button {
        width: auto;
        min-height: 40px;
        margin-top: 12px;
        padding: 8px 14px;
        border: 1px solid #765b5b;
        border-radius: 999px;
        color: #ffd1d1;
        font-size: 0.84rem;
        background: #2b1b1b;
    }

    .secondary-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 12px;
    }

    .secondary-actions button {
        min-height: 48px;
        padding: 9px 12px;
        border: 1px solid #555;
        border-radius: 999px;
        color: #ddd;
        background: #292929;
    }

    .safety-note {
        margin: 14px 0 0;
        color: #999;
        font-size: 0.82rem;
        line-height: 1.4;
    }

    @media (max-width: 480px) {
        .guided-overlay {
            place-items: start center;
        }

        .guided-card {
            margin: auto 0;
        }

        .secondary-actions {
            grid-template-columns: 1fr;
        }

        .device-selector {
            grid-template-columns: 1fr;
        }
    }

    .back-button {
        width: 100%;
        min-height: 50px;
        margin-top: 12px;
        padding: 10px 14px;
        border: 1px solid #6b83a6;
        border-radius: 999px;
        color: #fff;
        background: #354866;
    }
</style>
