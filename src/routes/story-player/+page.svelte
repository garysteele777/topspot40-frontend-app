<script lang="ts">
    import {onMount} from 'svelte';
    import {page} from '$app/stores';

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
    type Story = { ok: boolean; title?: string; story_text?: string; duration_seconds?: number; tts_bucket?: string; tts_key?: string; bed_bucket?: string; bed_key?: string; artwork_url?: string; message?: string };
    let story: Story | null = null;
    let loading = true;
    let error: string | null = null;
    let audio: HTMLAudioElement | null = null;
    let playing = false;

    onMount(async () => {
        const type = $page.url.searchParams.get('type');
        const slug = $page.url.searchParams.get('slug');
        const language = $page.url.searchParams.get('language') ?? 'en';
        if (type !== 'music_docuseries' || !slug) {
            error = 'This story could not be opened.';
            loading = false;
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/music-docuseries/play?slug=${encodeURIComponent(slug)}&language=${encodeURIComponent(language)}`, {method: 'POST'});
            if (!response.ok) throw new Error('Story service unavailable.');
            story = await response.json();
            if (!story?.ok) error = story?.message ?? 'Story not found.';
        } catch {
            error = 'Unable to load this story. Please try again.';
        } finally {
            loading = false;
        }
    });

    function togglePlayback() {
        if (!story?.tts_bucket || !story.tts_key) return;
        if (!audio) {
            audio = new Audio(`https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${story.tts_bucket}/${story.tts_key}`);
            audio.onended = () => playing = false;
        }
        if (playing) {
            audio.pause();
            playing = false;
        } else {
            audio.play().then(() => playing = true).catch(() => error = 'Audio is unavailable right now.');
        }
    }
</script>

<main class="story-page">
    <button class="back" on:click={() => history.back()}>← Back</button>
    {#if loading}
        <p role="status">Loading story…</p>
    {:else if error}
        <p class="error" role="alert">{error}</p>
    {:else if story}
        <article>
            {#if story.artwork_url}<img src={story.artwork_url} alt="" />{/if}
            <p class="eyebrow">Music Docuseries</p>
            <h1>{story.title}</h1>
            {#if story.duration_seconds}<p>{Math.max(1, Math.round(story.duration_seconds / 60))} min</p>{/if}
            {#if story.story_text}<p class="story-text">{story.story_text}</p>{/if}
            <button class="play" on:click={togglePlayback}>{playing ? 'Pause Story' : 'Play Story'}</button>
        </article>
    {/if}
</main>

<style>
    .story-page { min-height: 100vh; padding: 1.5rem; color: #f5f5f5; background: radial-gradient(circle at top, #1f1f1f, #050505 70%); }
    .back, .play { min-height: 44px; border-radius: 8px; cursor: pointer; font: inherit; }
    .back { padding: .5rem .8rem; color: #cfb87c; background: transparent; border: 1px solid #cfb87c; }
    article { max-width: 680px; margin: 2rem auto; padding: 1.5rem; border: 1px solid rgba(207,184,124,.4); border-radius: 12px; background: rgba(18,18,18,.95); }
    img { width: 100%; max-height: 340px; object-fit: cover; border-radius: 8px; }
    .eyebrow { color: #cfb87c; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
    .story-text { white-space: pre-line; line-height: 1.6; }
    .play { padding: .65rem 1rem; border: 1px solid #cfb87c; background: #cfb87c; color: #111; font-weight: 700; }
    button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .error { color: #ffb4a9; }
</style>
