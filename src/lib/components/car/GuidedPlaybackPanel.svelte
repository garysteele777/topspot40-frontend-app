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

    let device: DeviceType = 'computer';
    let spotifyActivated = false;

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

            <section
                    class="return-help pre-spotify-return-help"
                    aria-labelledby="return-help-heading"
            >
                <h3 id="return-help-heading">
                    Before you open Spotify
                </h3>

                <ol class="return-help-steps">
                    <li>
                        Select “Open this song in Spotify,” then press Play
                        in Spotify.
                    </li>
                    <li>
                        Listen to this song. When it ends, immediately pause
                        Spotify before the next queued song starts.
                    </li>
                    <li>
                        Return to this TopSpot40 page and select “Spotify is
                        paused — Continue.”
                    </li>
                </ol>

                <p class="return-help-warning">
                    Important: Spotify may automatically start the next
                    queued song if you do not pause it.
                </p>

                <p class="return-help-optional">
                    <strong>Want to move on early?</strong> Pause Spotify and
                    return to TopSpot40 whenever you’re ready to continue.
                </p>

                <h3 class="device-help-heading">
                    How to get back to TopSpot40
                </h3>

                <div
                        class="device-selector"
                        role="group"
                        aria-label="Choose your device"
                >
                    {#each [
                        ['android', 'Android'],
                        ['ios', 'iPhone'],
                        ['computer', 'Computer']
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
                        Tap the Recent Apps button (||| or square), then
                        tap Chrome or TopSpot40.
                    {:else if device === 'ios'}
                        Swipe up from the bottom and hold, then tap
                        Safari, Chrome, or TopSpot40. On an older iPhone,
                        double-press the Home button.
                    {:else}
                        Pause Spotify, then return to the TopSpot40
                        browser tab. If the Spotify app opened, select
                        your browser from the Windows taskbar or Mac Dock.
                    {/if}
                </div>
            </section>

            <button
                    type="button"
                    class="spotify-button"
                    on:click={openSpotify}
            >
                Open this song in Spotify
            </button>


            <button
                    class="back-button"
                    on:pointerdown|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                    on:click={onBackToCar}
            >
                ← BACK TO CAR PAGE / CHOOSE A TRACK
            </button>
            <ReportProblemButton
                    {language}
                    buttonLabel={language === 'en'
                        ? 'Having trouble? Report a problem'
                        : undefined}
                    onReport={() => onReportProblem?.()}
            />

            <p class="safety-note">
                For safety, make selections only while
                parked or let a passenger operate the phone.
            </p>
        {:else if returned}
            <h2 id="guided-heading">
                Welcome back
            </h2>

            <div class="track-name">
                {displayTrackName(track.trackName)}
            </div>

            <div class="artist-name">
                {displayTrackName(track.artistName)}
            </div>

            <p class="return-question">
                Is Spotify paused?
            </p>

            <p class="bio-instruction">
                Pause Spotify before continuing so another song does not play.
                You can return at any time—you do not have to finish the song.
            </p>

            <button
                    type="button"
                    class="continue-button"
                    on:click={onContinue}
            >
                Spotify is paused — Continue
            </button>


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
                    on:click={openSpotify}
            >
                Open Spotify Again
            </button>
            <button
                    type="button"
                    class="skip-button"
                    on:click={onSkip}
            >
                Song did not play — Skip
            </button>
            <ReportProblemButton
                    {language}
                    buttonLabel={language === 'en'
                        ? 'Having trouble? Report a problem'
                        : undefined}
                    onReport={() => onReportProblem?.()}
            />

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
                Spotify is paused — Continue
            </button>

            <div class="secondary-actions">
                <button on:click={openSpotify}>
                    Open Spotify Again
                </button>

                <button on:click={onSkip}>
                    Song did not play — Skip
                </button>
            </div>
            <ReportProblemButton
                    {language}
                    buttonLabel={language === 'en'
                        ? 'Having trouble? Report a problem'
                        : undefined}
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
