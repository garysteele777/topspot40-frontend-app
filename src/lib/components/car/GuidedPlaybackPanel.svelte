<script lang="ts">
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';

    export let track: CarModeTrack;
    export let opened = false;
    export let onOpenSpotify: () => void;
    export let onContinue: () => void;
    export let onSkip: () => void;
</script>

<section class="guided-card" aria-live="polite">
    <div class="mode-label">GUIDED PLAYBACK</div>

    {#if !opened}
        <h2>Ready to hear the song?</h2>

        <div class="track-name">{track.trackName}</div>
        <div class="artist-name">{track.artistName}</div>

        <p>
            Open Spotify and press Play. Return to TopSpot40
            when the song finishes.
        </p>

        <button class="spotify-button" on:click={onOpenSpotify}>
            ▶ PLAY ON SPOTIFY
        </button>
    {:else}
        <h2>Spotify is ready</h2>

        <div class="track-name">{track.trackName}</div>
        <div class="artist-name">{track.artistName}</div>

        <p>Listen in Spotify. When the song finishes, continue here.</p>

        <button class="continue-button" on:click={onContinue}>
            SONG FINISHED — CONTINUE
        </button>

        <div class="secondary-actions">
            <button on:click={onOpenSpotify}>Play Song Again</button>
            <button on:click={onSkip}>Skip Track</button>
        </div>
    {/if}
</section>

<style>
    .guided-card {
        width: min(560px, calc(100% - 32px));
        margin: 18px auto;
        padding: 22px;
        text-align: center;
        border: 1px solid rgba(29, 185, 84, 0.65);
        border-radius: 18px;
        background: rgba(18, 18, 18, 0.97);
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
    }

    .mode-label {
        margin-bottom: 8px;
        color: #1db954;
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.12em;
    }

    h2 {
        margin: 0 0 12px;
        color: #fff;
    }

    .track-name {
        color: #cfb87c;
        font-size: 1.25rem;
        font-weight: 800;
    }

    .artist-name {
        margin-top: 4px;
        color: #ddd;
    }

    p {
        color: #bbb;
        line-height: 1.45;
    }

    button {
        cursor: pointer;
        border: 0;
        font: inherit;
        font-weight: 800;
    }

    .spotify-button,
    .continue-button {
        width: 100%;
        min-height: 56px;
        padding: 12px 18px;
        border-radius: 999px;
        color: #fff;
        background: #1db954;
    }

    .continue-button {
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
        min-height: 44px;
        padding: 9px 12px;
        border: 1px solid #555;
        border-radius: 999px;
        color: #ddd;
        background: #292929;
    }
</style>
