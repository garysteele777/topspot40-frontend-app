<script lang="ts">
    import {onMount} from 'svelte';
    import {page} from '$app/stores';
    import {goto} from '$app/navigation';
    import {isSafeMusicDocuseriesReturnPath} from '$lib/musicDocuseries/launchMusicDocuseries';

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    type StoryResponse = {
        ok: boolean;
        story_id?: number;
        title?: string;
        story_text?: string;
        duration_seconds?: number;
        tts_bucket?: string;
        tts_key?: string;
        bed_bucket?: string;
        bed_key?: string;
        artist_id?: number;
        artist_name?: string;
        artist_artwork?: string;
        message?: string;
        content_type?: string;
        slug?: string;
        artwork_url?: string;
        target_length?: string;
        has_youtube_video?: boolean;
        youtube_video_id?: string;
        youtube_url?: string;
    };
    let audio: HTMLAudioElement | null = null;
    let bedAudio: HTMLAudioElement | null = null;
    const BED_VOLUME = 0.035;

    let isPlaying = false;
    let currentTime = 0;
    let totalTime = 0;
    let showMoreInfo = false;

    $: progressPercent =
        totalTime > 0
            ? Math.min(100, (currentTime / totalTime) * 100)
            : 0;


    let artistId: string | null = null;
    let artistName = '';
    let language = 'en';

    let contentType = 'artist_story';
    let slug: string | null = null;
    let docuseriesCollection: string | null = null;
    let returnTo: string | null = null;

    let story: StoryResponse | null = null;
    let error: string | null = null;
    let loading = true;

    function playStory() {
        if (!story?.tts_bucket || !story?.tts_key) return;

        const narrationUrl =
            `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/` +
            `${story.tts_bucket}/${story.tts_key}`;

        const bedUrl =
            story.bed_bucket && story.bed_key
                ? `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/` +
                `${story.bed_bucket}/${story.bed_key}`
                : null;

        audio?.pause();
        bedAudio?.pause();

        audio = new Audio(narrationUrl);
        audio.volume = 0.75;   // 75% volume

        if (bedUrl) {
            bedAudio = new Audio(bedUrl);
            bedAudio.loop = true;
            bedAudio.volume = BED_VOLUME;
        } else {
            bedAudio = null;
        }

        audio.ontimeupdate = () => {
            currentTime = audio?.currentTime ?? 0;
        };

        audio.onloadedmetadata = () => {
            totalTime = audio?.duration ?? story?.duration_seconds ?? 0;
        };

        audio.onended = () => {
            isPlaying = false;

            if (bedAudio) {
                bedAudio.pause();
                bedAudio.currentTime = 0;
            }
        };

        if (bedAudio) {
            bedAudio.play().catch(() => {
            });
        }

        audio.play();
        isPlaying = true;
    }

    function formatTime(seconds: number): string {
        if (!Number.isFinite(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function pauseStory() {
        audio?.pause();
        bedAudio?.pause();
        isPlaying = false;
    }

    function resumeStory() {
        bedAudio?.play().catch(() => {
        });
        audio?.play();
        isPlaying = true;
    }

    function stopStory() {
        audio?.pause();
        bedAudio?.pause();

        if (audio) {
            audio.currentTime = 0;
        }

        if (bedAudio) {
            bedAudio.currentTime = 0;
        }

        currentTime = 0;
        isPlaying = false;
    }

    function titleCase(value: string): string {
        return value
            .split(' ')
            .map(word =>
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
            )
            .join(' ');
    }

    function formatMinutes(seconds?: number | null): string {
        if (!seconds) return '';
        const minutes = Math.max(1, Math.round(seconds / 60));
        return `${minutes} min`;
    }

    function youtubeButtonLabel(
        languageCode: string
    ): string {
        if (languageCode === 'es') {
            return '▶ Ver documental';
        }

        if (languageCode === 'pt-BR') {
            return '▶ Assistir documentário';
        }

        return '▶ Watch Documentary';
    }

    async function goBack(): Promise<void> {
        stopStory();

        if (contentType === 'music_docuseries' && isSafeMusicDocuseriesReturnPath(returnTo)) {
            await goto(returnTo);
            return;
        }

        if (contentType === 'music_docuseries' && docuseriesCollection) {
            await goto(
                `/options-v4?panel=library` +
                `&tab=collections` +
                `&collection_group=music_docuseries` +
                `&docuseries_collection=${encodeURIComponent(docuseriesCollection)}` +
                `#listening-library`
            );
            return;
        }

        history.back();
    }

    onMount(async () => {
        artistId = $page.url.searchParams.get('artist_id');
        artistName = $page.url.searchParams.get('artist') ?? '';
        language = $page.url.searchParams.get('language') ?? 'en';

        contentType = $page.url.searchParams.get('type') ?? 'artist_story';
        slug = $page.url.searchParams.get('slug');
        docuseriesCollection =
            $page.url.searchParams.get('collection');
        returnTo = $page.url.searchParams.get('returnTo');

        try {
            let url = '';

            if (contentType === 'music_docuseries') {
                if (!slug) {
                    error = 'Missing docuseries slug.';
                    loading = false;
                    return;
                }

                url =
                    `${API_BASE}/music-docuseries/play` +
                    `?slug=${slug}&language=${language}`;
            } else {
                if (!artistId) {
                    error = 'Missing artist id.';
                    loading = false;
                    return;
                }

                url =
                    `${API_BASE}/artist-spotlight/play-artist-story` +
                    `?artist_id=${artistId}&language=${language}`;
            }

            const res = await fetch(url, {
                method: 'POST'
            });

            story = await res.json();

            if (story && !story.ok) {
                error = story.message ?? 'Story not found.';
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load artist story.';
        } finally {
            loading = false;
        }
    });
</script>

<div class="story-page">
    <button class="back-btn" on:click={goBack}>
        ← Back
    </button>

    {#if loading}
        <div class="status">Loading story...</div>
    {:else if error}
        <div class="status error">{error}</div>
    {:else if story}
        <div class="story-card">
            <div class="label">
                {contentType === 'music_docuseries'
                    ? 'Music Docuseries'
                    : 'Artist Story'}
            </div>

            {#if story.artist_artwork || story.artwork_url}
                <img
                        class="artist-artwork"
                        src={story.artist_artwork ?? story.artwork_url}
                        alt={story.title ?? 'Artwork'}
                />
            {/if}
            <h1>
                {contentType === 'music_docuseries'
                    ? story.title
                    : titleCase(story.artist_name ?? artistName)}
            </h1>

            {#if !audio && story.duration_seconds}
                <div class="duration">{formatMinutes(story.duration_seconds)}</div>
            {/if}

            {#if audio}
                <div class="progress-container">
                    <div
                            class="progress-fill"
                            style={`width: ${progressPercent}%`}
                    ></div>
                </div>

                <div class="time-display">
                    {formatTime(currentTime)} / {formatTime(totalTime || story.duration_seconds || 0)}
                </div>
            {/if}

            <div class="story-controls">
                {#if !audio}
                    <button class="play-btn" on:click={playStory}>
                        ▶ Play Story
                    </button>
                {:else if isPlaying}
                    <button class="play-btn" on:click={pauseStory}>
                        ⏸ Pause
                    </button>

                    <button class="secondary-btn" on:click={stopStory}>
                        ■ Stop
                    </button>
                {:else}
                    <button class="play-btn" on:click={resumeStory}>
                        ▶ Resume
                    </button>

                    <button class="secondary-btn" on:click={stopStory}>
                        ■ Stop
                    </button>
                {/if}
            </div>

            {#if
                contentType === 'music_docuseries' &&
                story.has_youtube_video &&
                story.youtube_url
            }
                <a
                    class="youtube-btn"
                    href={story.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {youtubeButtonLabel(language)}
                </a>
            {/if}

            {#if story.story_text}
                <button
                        class="more-info-btn"
                        on:click={() => showMoreInfo = !showMoreInfo}
                >
                    {showMoreInfo ? 'Hide Story Text' : 'Show Story Text'}
                </button>
            {/if}

            {#if showMoreInfo && story.story_text}
                <div class="story-text-panel">
                    {#each story.story_text.split('\n').filter(p => p.trim()) as paragraph}
                        <p>{paragraph}</p>
                    {/each}
                </div>
            {/if}
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
        max-width: 900px;
        margin: 0 auto;
        padding: 24px 32px;
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
        margin: 4px auto 16px;
        display: block;
    }

    .story-controls {
        display: flex;
        justify-content: center;
        gap: 12px;
    }

    .secondary-btn {
        background: transparent;
        color: #cfb87c;
        border: 1px solid rgba(207, 184, 124, 0.55);
        border-radius: 999px;
        padding: 12px 24px;
        font-weight: 800;
        cursor: pointer;
        font-size: 1rem;
    }

    .time-display {
        color: #aaa;
        font-size: 0.9rem;
        margin-bottom: 18px;
    }

    .progress-container {
        width: 100%;
        max-width: 420px;
        height: 8px;
        margin: 12px auto 10px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #cfb87c;
        transition: width 0.25s linear;
    }

    .youtube-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 18px auto 0;
        background: #cfb87c;
        color: #000;
        border: none;
        border-radius: 999px;
        padding: 12px 26px;
        font-weight: 800;
        font-size: 1rem;
        text-decoration: none;
        cursor: pointer;
    }

    .youtube-btn:hover {
        background: #dfc98f;
    }

    .more-info-btn {
        display: block;
        margin: 20px auto;
        background: transparent;
        color: #cfb87c;
        border: 1px solid rgba(207, 184, 124, 0.55);
        border-radius: 999px;
        padding: 10px 22px;
        font-weight: 700;
        cursor: pointer;
        font-size: 0.95rem;
    }

    .story-text-panel {
        margin-top: 24px;
        text-align: left;
        max-width: 760px;
        line-height: 1.8;
        color: #e8e8e8;
    }

    .story-text-panel p {
        margin-bottom: 18px;
    }

</style>