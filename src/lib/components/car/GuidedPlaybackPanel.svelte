<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';

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

    type DeviceType = 'ios' | 'android' | 'other';

    let device: DeviceType = 'other';
    let showDetailedHelp = true;
    let bioButton: HTMLButtonElement | null = null;
    let showArtistInBioLabel = false;
    let bioButtonObserver: ResizeObserver | null = null;

    const HELP_STORAGE_KEY =
        'ts-guided-return-help-seen-v1';

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

    function rememberHelp(): void {
        showDetailedHelp = false;

        localStorage.setItem(
            HELP_STORAGE_KEY,
            'true'
        );
    }

    onMount(() => {
        device = detectDevice();

        showDetailedHelp =
            localStorage.getItem(
                HELP_STORAGE_KEY
            ) !== 'true';

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-heading"
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

            <div class="steps">
                <div>
                    <span>1</span>
                    Tap the Spotify button below.
                </div>

                <div>
                    <span>2</span>
                    Press Play in Spotify.
                </div>

                <div>
                    <span>3</span>
                    Return here when the song finishes.
                </div>
            </div>

            <div class="return-help">
                <strong>
                    {#if device === 'ios'}
                        How to return on iPhone
                    {:else if device === 'android'}
                        How to return on Android
                    {:else}
                        How to return to TopSpot40
                    {/if}
                </strong>

                {#if device === 'ios'}
                    <p>
                        Swipe up from the bottom and pause,
                        then tap TopSpot40, Safari, or Chrome.
                    </p>

                    {#if showDetailedHelp}
                        <p class="detail">
                            On an older iPhone with a Home
                            button, double-press the Home
                            button instead.
                        </p>
                    {/if}
                {:else if device === 'android'}
                    <p>
                        Swipe up from the bottom and hold,
                        or tap Recent Apps. Then tap
                        TopSpot40 or Chrome.
                    </p>
                {:else}
                    <p>
                        Use your phone’s Recent Apps or
                        App Switcher, then select
                        TopSpot40, Safari, or Chrome.
                    </p>
                {/if}

                {#if showDetailedHelp}
                    <button
                            class="remember-button"
                            on:click={rememberHelp}
                    >
                        Got it — show the short reminder next time
                    </button>
                {:else}
                    <button
                            class="remember-button"
                            on:click={() => {
                                showDetailedHelp = true;
                            }}
                    >
                        Show step-by-step help
                    </button>
                {/if}
            </div>

            {#if hasArtistBio}
                <button
                        bind:this={bioButton}
                        class="artist-bio-button"
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
                    class="spotify-button"
                    on:click={onOpenSpotify}
            >
                ▶ OPEN IN SPOTIFY
            </button>

            <button
                    class="back-button"
                    on:click={onBackToCar}
            >
                ← BACK TO CAR PAGE / CHOOSE A TRACK
            </button>

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

            {#if hasArtistBio}
                <p class="bio-instruction">
                    Pause Spotify first if the song is still playing.
                </p>

                <button
                        bind:this={bioButton}
                        class="artist-bio-button"
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
                    class="continue-button"
                    on:click={onContinue}
            >
                ▶ CONTINUE TO NEXT TRACK
            </button>

            <button
                    class="back-button"
                    on:click={onBackToCar}
            >
                ← BACK TO CAR PAGE / CHOOSE A TRACK
            </button>

            <div class="secondary-actions">
                <button on:click={onOpenSpotify}>
                    Open Spotify Again
                </button>

                <button on:click={onSkip}>
                    Song Did Not Play — Skip
                </button>
            </div>
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

    .steps {
        display: grid;
        gap: 9px;
        margin: 22px 0;
        text-align: left;
        color: #ddd;
    }

    .steps div {
        display: flex;
        align-items: center;
        gap: 11px;
    }

    .steps span {
        display: inline-grid;
        flex: 0 0 30px;
        width: 30px;
        height: 30px;
        place-items: center;
        border-radius: 50%;
        color: #111;
        background: #cfb87c;
        font-weight: 900;
    }

    .return-help {
        margin: 18px 0;
        padding: 15px;
        border-radius: 14px;
        color: #ddd;
        background: #202024;
    }

    .return-help strong {
        color: #fff;
    }

    .return-help p {
        margin: 8px 0 0;
        line-height: 1.45;
    }

    .return-help .detail {
        color: #aaa;
        font-size: 0.92rem;
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

    .remember-button {
        margin-top: 12px;
        padding: 7px 10px;
        color: #8cc8ff;
        text-decoration: underline;
        background: transparent;
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

    .spotify-button,
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
