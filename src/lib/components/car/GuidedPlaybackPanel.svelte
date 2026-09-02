<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {createBroadActivation} from '$lib/interactions/broadActivation.js';
    import ReportProblemButton from './ReportProblemButton.svelte';

    export let track: CarModeTrack;
    export let opened = false;
    export let returned = false;
    export let hasArtistBio = false;
    export let artistBioPlaying = false;
    export let onPlayArtistBio: () => Promise<void>;
    export let onStopArtistBio: () => void;
    export let onOpenSpotify: () => void;
    export let onContinue: () => void;
    export let onSkip: () => void;
    export let onBackToCar: () => void;
    export let language = 'en';
    export let onReportProblem: (() => void) | undefined;

    type DeviceType = 'ios' | 'android' | 'other';

    let device: DeviceType = 'other';
    let bioButton: HTMLButtonElement | null = null;
    let showArtistInBioLabel = false;
    let bioButtonObserver: ResizeObserver | null = null;
    let spotifyActivated = false;

    const spotifyActivation = createBroadActivation({
        onActivate: () => {
            spotifyActivated = true;
            onOpenSpotify();
        }
    });
    const continueActivation = createBroadActivation({
        onActivate: () => onContinue()
    });

    function handlePrimaryKeydown(event: KeyboardEvent): void {
        if (
            event.target !== event.currentTarget
            || (event.key !== 'Enter' && event.key !== ' ')
        ) {
            return;
        }

        event.preventDefault();
        const activation = !opened
            ? spotifyActivation
            : returned
                ? continueActivation
                : null;
        activation?.keyboardActivate({detail: 0});
    }

    function handlePrimaryPointerDown(event: PointerEvent): void {
        if (!opened) {
            spotifyActivation.pointerDown(event);
        } else if (returned) {
            continueActivation.pointerDown(event);
        }
    }

    function handlePrimaryPointerUp(event: PointerEvent): void {
        if (!opened) {
            spotifyActivation.pointerUp(event);
        } else if (returned) {
            continueActivation.pointerUp(event);
        }
    }

    function handlePrimaryPointerCancel(): void {
        spotifyActivation.pointerCancel();
        continueActivation.pointerCancel();
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

    function updateBioButtonLabel(): void {
        if (!bioButton) return;

        const artist = displayTrackName(track.artistName);
        const personalized =
            `▶ PLAY ${artist.toLocaleUpperCase()} BIO`;
        const context =
            document.createElement('canvas').getContext('2d');

        if (!context) {
            showArtistInBioLabel = false;
            return;
        }

        context.font = getComputedStyle(bioButton).font;
        showArtistInBioLabel =
            context.measureText(personalized).width
            <= bioButton.clientWidth - 36;
    }

    $: if (bioButton && track.artistName) {
        queueMicrotask(updateBioButtonLabel);
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

        return 'other';
    }

    onMount(() => {
        device = detectDevice();

        bioButtonObserver = new ResizeObserver(
            updateBioButtonLabel
        );

        if (bioButton) {
            bioButtonObserver.observe(bioButton);
            updateBioButtonLabel();
        }
    });

    onDestroy(() => {
        bioButtonObserver?.disconnect();
    });
</script>

<div
        class="guided-overlay"
        class:primary-spotify-area={!opened || returned}
        class:spotifyActivated
        role="dialog"
        tabindex="0"
        aria-modal="true"
        aria-labelledby="guided-heading"
        on:pointerdown={handlePrimaryPointerDown}
        on:pointerup={handlePrimaryPointerUp}
        on:pointercancel={handlePrimaryPointerCancel}
        on:keydown={handlePrimaryKeydown}
>
    <section class="guided-card" aria-live="polite">
        <div class="mode-label">
            GUIDED PLAYBACK
        </div>

        {#if !opened}
            <div class="state-label">
                NARRATION COMPLETE
            </div>

            <h2 id="guided-heading">
                Ready to hear the song?
            </h2>

            <div class="track-name">
                {displayTrackName(track.trackName)}
            </div>

            <div class="artist-name">
                {displayTrackName(track.artistName)}
            </div>

            <div class="spotify-cue" aria-hidden="true">
                <span class="spotify-mark">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4.5 8.1c5.1-1.5 10.8-.8 15.2 1.7" />
                        <path d="M5.7 12c4.2-1.2 8.9-.6 12.6 1.5" />
                        <path d="M6.9 15.7c3.2-.9 6.7-.4 9.5 1.2" />
                    </svg>
                </span>
                <span>Tap anywhere else to open in Spotify</span>
            </div>

            {#if hasArtistBio}
                <button
                        bind:this={bioButton}
                        class="artist-bio-button"
                        on:pointerdown|stopPropagation
                        on:pointerup|stopPropagation
                        on:pointercancel|stopPropagation
                        on:click={() => {
                            if (artistBioPlaying) {
                                onStopArtistBio();
                            } else {
                                void onPlayArtistBio();
                            }
                        }}
                >
                    {#if artistBioPlaying}
                        ■ STOP ARTIST BIO
                    {:else if showArtistInBioLabel}
                        ▶ PLAY {displayTrackName(track.artistName).toLocaleUpperCase()} BIO
                    {:else}
                        ▶ PLAY ARTIST BIO
                    {/if}
                </button>
            {/if}

            <button
                    class="back-button"
                    on:pointerdown|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                    on:click={onBackToCar}
            >
                ← BACK TO CAR PAGE / CHOOSE A TRACK
            </button>
            <ReportProblemButton {language} onReport={() => onReportProblem?.()} />

            <p class="safety-note">
                For safety, make selections only while
                parked or let a passenger operate the phone.
            </p>
        {:else if returned}
            <div class="state-label">
                WELCOME BACK
            </div>

            <h2 id="guided-heading">
                Did the song finish?
            </h2>

            <div class="track-name">
                {displayTrackName(track.trackName)}
            </div>

            <div class="artist-name">
                {displayTrackName(track.artistName)}
            </div>

            <p class="bio-instruction">
                Pause Spotify first if the song is still playing.
            </p>

            <div class="continue-cue" aria-hidden="true">
                <span class="continue-mark">
                    <img src="/old-dog-icon.png" alt="" />
                </span>
                <span>Tap anywhere else to continue to the next track</span>
            </div>

            {#if hasArtistBio}
                <button
                        bind:this={bioButton}
                        class="artist-bio-button"
                        on:pointerdown|stopPropagation
                        on:pointerup|stopPropagation
                        on:pointercancel|stopPropagation
                        on:click={() => {
                            if (artistBioPlaying) {
                                onStopArtistBio();
                            } else {
                                void onPlayArtistBio();
                            }
                        }}
                >
                    {#if artistBioPlaying}
                        ■ STOP ARTIST BIO
                    {:else if showArtistInBioLabel}
                        ▶ PLAY {displayTrackName(track.artistName).toLocaleUpperCase()} BIO
                    {:else}
                        ▶ PLAY ARTIST BIO
                    {/if}
                </button>
            {/if}

            <button
                    class="back-button"
                    on:pointerdown|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                    on:click={onBackToCar}
            >
                ← BACK TO CAR PAGE / CHOOSE A TRACK
            </button>

            <button
                    class="recovery-spotify-button"
                    on:pointerdown|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                    on:click={onOpenSpotify}
            >
                Open Spotify Again
            </button>
            <ReportProblemButton {language} onReport={() => onReportProblem?.()} />

            <p class="safety-note">
                For safety, make selections only while
                parked or let a passenger operate the phone.
            </p>
        {:else}
            <div class="state-label">
                SPOTIFY OPENED
            </div>

            <h2 id="guided-heading">
                Play the song in Spotify
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
                        When it finishes, swipe up and pause,
                        then return to TopSpot40, Safari,
                        or Chrome.
                    </p>
                {:else if device === 'android'}
                    <p>
                        When it finishes, open Recent Apps
                        and return to TopSpot40 or Chrome.
                    </p>
                {:else}
                    <p>
                        When it finishes, return to this
                        TopSpot40 window.
                    </p>
                {/if}
            </div>

            <button
                    class="continue-button"
                    on:click={onContinue}
            >
                SONG FINISHED — CONTINUE
            </button>

            <div class="secondary-actions">
                <button on:click={onOpenSpotify}>
                    Open Spotify Again
                </button>

                <button on:click={onSkip}>
                    Song Did Not Play — Skip
                </button>
            </div>
            <ReportProblemButton {language} onReport={() => onReportProblem?.()} />
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

    .return-help.compact {
        margin-top: 22px;
    }

    button {
        cursor: pointer;
        border: 0;
        font: inherit;
        font-weight: 800;
    }

    .primary-spotify-area {
        cursor: pointer;
    }

    .spotifyActivated .guided-card {
        border-color: #38d873;
        box-shadow: 0 18px 55px rgba(29, 185, 84, 0.32);
    }

    .spotify-cue {
        display: grid;
        justify-items: center;
        gap: clamp(14px, 3vw, 20px);
        width: 100%;
        margin: clamp(26px, 6vw, 40px) 0;
        padding: 8px 12px;
        color: #b9f5cc;
        font-size: 0.95rem;
        background: transparent;
    }

    .spotify-mark {
        display: grid;
        width: clamp(72px, 20vw, 96px);
        height: clamp(72px, 20vw, 96px);
        place-items: center;
        border: clamp(3px, 0.8vw, 4px) solid #1db954;
        border-radius: 50%;
        color: #1db954;
    }

    .spotify-mark svg {
        width: 68%;
        height: 68%;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-width: 2.5;
    }

    .continue-cue {
        display: grid;
        justify-items: center;
        gap: 16px;
        margin: 28px 0;
        padding: 8px 12px;
        color: #d9c990;
        font-size: clamp(1.04rem, 4vw, 1.16rem);
        font-weight: 800;
        line-height: 1.35;
    }

    .continue-mark {
        display: grid;
        width: clamp(76px, 20vw, 92px);
        height: clamp(76px, 20vw, 92px);
        place-items: center;
        overflow: hidden;
        border: clamp(3px, 0.8vw, 4px) solid #cfb87c;
        border-radius: 50%;
        background: #111;
    }

    .continue-mark img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    }

    .continue-cue span:last-child {
        max-width: min(100%, 390px);
    }

    .artist-bio-button {
        width: 100%;
        min-height: 56px;
        margin-bottom: 12px;
        padding: 12px 18px;
        overflow: hidden;
        border: 1px solid #cfb87c;
        border-radius: 999px;
        color: #cfb87c;
        font-size: 1.05rem;
        white-space: nowrap;
        text-overflow: ellipsis;
        background: #29251d;
    }

    .artist-bio-button:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 3px;
    }

    .bio-instruction {
        margin: 20px 0 10px;
        color: #ddd;
        font-size: 0.95rem;
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
