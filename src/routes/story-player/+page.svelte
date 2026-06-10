<script lang="ts">
    import {onMount} from 'svelte';
    import {page} from '$app/stores';

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    type StoryResponse = {
        ok: boolean;
        story_id?: number;
        title?: string;
        duration_seconds?: number;
        tts_bucket?: string;
        tts_key?: string;
        artist_id?: number;
        artist_name?: string;
        artist_artwork?: string;
        message?: string;
    };

    let audio: HTMLAudioElement | null = null;
    let isPlaying = false;

    let artistId: string | null = null;
    let artistName = '';
    let language = 'en';

    let story: StoryResponse | null = null;
    let error: string | null = null;
    let loading = true;

    function playStory() {
        if (!story?.tts_bucket || !story?.tts_key) return;

        const url =
            `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/` +
            `${story.tts_bucket}/${story.tts_key}`;

        audio?.pause();

        audio = new Audio(url);
        audio.onended = () => {
            isPlaying = false;
        };

        audio.play();
        isPlaying = true;
    }

    function formatMinutes(seconds?: number | null): string {
        if (!seconds) return '';
        const minutes = Math.max(1, Math.round(seconds / 60));
        return `${minutes} min`;
    }

    onMount(async () => {
        artistId = $page.url.searchParams.get('artist_id');
        artistName = $page.url.searchParams.get('artist') ?? '';
        language = $page.url.searchParams.get('language') ?? 'en';

        if (!artistId) {
            error = 'Missing artist id.';
            loading = false;
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}/artist-spotlight/play-artist-story?artist_id=${artistId}&language=${language}`,
                {method: 'POST'}
            );

            story = await res.json();

            if (story && !story.ok) {
                error = story.message ?? 'Artist story not found.';
            }

        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load artist story.';
        } finally {
            loading = false;
        }
    });
</script>

<div class="story-page">
    <button class="back-btn" on:click={() => history.back()}>
        ← Back
    </button>

    {#if loading}
        <div class="status">Loading story...</div>
    {:else if error}
        <div class="status error">{error}</div>
    {:else if story}
        <div class="story-card">
            <div class="label">Artist Story</div>

            {#if story.artist_artwork}
                <img
                        class="artist-artwork"
                        src={story.artist_artwork}
                        alt={story.title ?? 'Artist artwork'}
                />
            {/if}

            <h1>{story.title ?? `The Story of ${artistName}`}</h1>

            {#if story.duration_seconds}
                <div class="duration">{formatMinutes(story.duration_seconds)}</div>
            {/if}

            <button class="play-btn" on:click={playStory}>
                {isPlaying ? 'Playing...' : '▶ Play Story'}
            </button>
        </div>
    {/if}
</div>

<style>
    .story-page {
        min-height: 100vh;
        background: #111;
        color: #f5f5f5;
        padding: 24px;
    }

    .back-btn {
        background: transparent;
        color: #cfb87c;
        border: 1px solid rgba(207, 184, 124, 0.45);
        border-radius: 999px;
        padding: 8px 16px;
        cursor: pointer;
        margin-bottom: 24px;
    }

    .story-card {
        max-width: 720px;
        margin: 0 auto;
        padding: 32px;
        border-radius: 18px;
        background: rgba(18, 18, 18, 0.95);
        border: 1px solid rgba(207, 184, 124, 0.35);
        text-align: center;
    }

    .label {
        color: #cfb87c;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-weight: 700;
        font-size: 0.8rem;
        margin-bottom: 10px;
    }

    h1 {
        font-size: 2.2rem;
        margin: 0 0 12px;
    }

    .duration {
        color: #cfb87c;
        margin-bottom: 24px;
        font-weight: 700;
    }

    .play-btn {
        background: #cfb87c;
        color: #000;
        border: none;
        border-radius: 999px;
        padding: 12px 26px;
        font-weight: 800;
        cursor: pointer;
        font-size: 1rem;
    }

    .status {
        text-align: center;
        color: #ccc;
        margin-top: 48px;
    }

    .error {
        color: #ff9a9a;
    }

    .artist-artwork {
        width: 190px;
        height: 190px;
        object-fit: cover;
        border-radius: 50%;
        border: 3px solid rgba(207, 184, 124, 0.65);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
        margin: 8px auto 22px;
        display: block;
    }
</style>