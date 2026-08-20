<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import ProgramJourneyShell from '$lib/components/journey/ProgramJourneyShell.svelte';
    import ArtistSpotlightTrackPreview from '$lib/components/journey/ArtistSpotlightTrackPreview.svelte';
    import {
        fetchArtistStory,
        fetchArtistTracks,
        titleCaseArtistName
    } from '$lib/artistSpotlights/catalogAdapter';
    import {buildArtistSpotlightJourneyLaunchUrl} from '$lib/artistSpotlights/launchArtistSpotlight';
    import {
        ARTIST_SPOTLIGHT_FALLBACK_ARTWORK,
        ARTIST_SPOTLIGHTS_ACCENT,
        ARTIST_SPOTLIGHTS_JOURNEY_ARTWORK,
        artistSpotlightDescription
    } from '$lib/config/artistSpotlightsJourney';
    import {ARTIST_ALPHABET_RANGES} from '$lib/artistSpotlights/types';
    import type {ArtistStoryInfo, ArtistTrackItem} from '$lib/artistSpotlights/types';
    import type {Language} from '$lib/types/playback';

    let language: Language = 'en';
    let artistId: number | null = null;
    let artistName = '';
    let tracks: ArtistTrackItem[] = [];
    let story: ArtistStoryInfo | null = null;
    let tracksLoading = true;
    let storyLoading = true;
    let tracksError: string | null = null;
    let storyError: string | null = null;
    let invalidRoute = false;

    function readLanguage(): Language {
        const saved = localStorage.getItem('topspot_language');
        return saved === 'es' || saved === 'ptbr' ? saved : 'en';
    }

    function browserReturnPath(): string {
        const query = new URLSearchParams();
        const category = page.url.searchParams.get('category');
        const range = page.url.searchParams.get('range');
        const genre = page.url.searchParams.get('genre');

        query.set('category', category === 'other' || category === 'single' ? category : 'featured');
        query.set('range', ARTIST_ALPHABET_RANGES.includes(range as typeof ARTIST_ALPHABET_RANGES[number]) ? range! : 'A-B');
        query.set('genre', genre || 'all');
        return `/journey-prototype/artist-spotlights?${query.toString()}`;
    }

    async function loadTracks(): Promise<void> {
        if (artistId === null) return;

        try {
            tracks = await fetchArtistTracks(artistId);
            if (tracks.length === 0) {
                invalidRoute = true;
                return;
            }
            artistName = titleCaseArtistName(tracks[0].artist_name);
        } catch (error) {
            console.error('Failed to load Artist Spotlight tracks:', error);
            tracksError = 'We could not load this Artist Spotlight program.';
        } finally {
            tracksLoading = false;
        }
    }

    async function loadStory(): Promise<void> {
        if (artistId === null) return;

        try {
            story = await fetchArtistStory(artistId, language);
            if (!artistName && story?.artist_name) artistName = titleCaseArtistName(story.artist_name);
        } catch (error) {
            console.error('Failed to load Artist Spotlight story:', error);
            storyError = 'Artist story details are temporarily unavailable.';
        } finally {
            storyLoading = false;
        }
    }

    function startArtistSpotlight(): void {
        if (artistId === null || !artistName || tracks.length === 0) return;

        void goto(buildArtistSpotlightJourneyLaunchUrl({
            artistId,
            artistName,
            genre: page.url.searchParams.get('genre') ?? 'all',
            language,
            returnTo: browserReturnPath()
        }));
    }

    function playArtistStory(): void {
        if (artistId === null || !artistName) return;

        const query = new URLSearchParams({
            type: 'artist_story',
            artist_id: String(artistId),
            artist: artistName,
            genre: page.url.searchParams.get('genre') ?? '',
            language
        });
        void goto(`/story-player?${query.toString()}`);
    }

    function openDocumentary(): void {
        if (story?.youtube_url) window.open(story.youtube_url, '_blank', 'noopener,noreferrer');
    }

    onMount(async () => {
        language = readLanguage();
        const parsedId = Number(page.params.artistId);

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            invalidRoute = true;
            tracksLoading = false;
            storyLoading = false;
            return;
        }

        artistId = parsedId;
        await Promise.all([loadTracks(), loadStory()]);
    });

    $: title = artistName || 'Artist Spotlight';
    $: artwork = story?.artist_artwork ?? tracks[0]?.album_artwork ?? ARTIST_SPOTLIGHT_FALLBACK_ARTWORK;
    $: backHref = browserReturnPath();
</script>

<svelte:head>
    <title>{title} | TopSpot40</title>
    <meta name="description" content={artistName ? `Preview the ${artistName} Artist Spotlight program.` : 'Preview a TopSpot40 Artist Spotlight program.'}/>
</svelte:head>

<ProgramJourneyShell
    {language}
    {title}
    instruction="Preview the artist's program, then start listening in the TopSpot40 player."
    {backHref}
    backLabel="Back to Artists"
npm    accent={ARTIST_SPOTLIGHTS_ACCENT}
    artwork={ARTIST_SPOTLIGHTS_JOURNEY_ARTWORK}
    artworkAlt="A grand music library illuminated for an Artist Spotlight journey"
>
    {#if tracksLoading}
        <div class="state" aria-live="polite">Loading Artist Spotlight contents…</div>
    {:else if invalidRoute}
        <div class="state invalid" role="alert">
            <h2>This Artist Spotlight could not be found.</h2>
            <a href={backHref}>← Back to Artists</a>
        </div>
    {:else if tracksError}
        <div class="state error" role="alert">{tracksError}</div>
    {:else}
        <header class="artist-summary">
            <img src={artwork} alt=""/>
            <div class="summary-copy">
                <span class="eyebrow">TopSpot40 Artist Spotlight</span>
                <p>{artistSpotlightDescription(artistName)}</p>
                <strong>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</strong>
                {#if storyError}<small class="story-warning">{storyError}</small>{/if}
            </div>
            <div class="actions">
                <button class="start" type="button" on:click={startArtistSpotlight}>
                    <span aria-hidden="true">▶</span> Start Artist Spotlight
                </button>
                {#if !storyLoading && story?.has_story}
                    <button type="button" class="secondary" on:click={playArtistStory}>
                        Play Artist Story{story.duration_seconds ? ` (${Math.max(1, Math.round(story.duration_seconds / 60))} min)` : ''}
                    </button>
                {/if}
                {#if !storyLoading && story?.has_youtube_video && story.youtube_url}
                    <button type="button" class="secondary" on:click={openDocumentary}>Watch Documentary</button>
                {/if}
            </div>
        </header>

        <ArtistSpotlightTrackPreview {tracks}/>
    {/if}
</ProgramJourneyShell>

<style>
    .artist-summary { display: grid; grid-template-columns: 112px minmax(0, 1fr) auto; gap: 20px; align-items: center; margin-bottom: 24px; padding-bottom: 22px; border-bottom: 1px solid rgba(240, 186, 99, 0.32); }
    .artist-summary > img { width: 112px; height: 112px; object-fit: cover; background: #21180d; border: 2px solid rgba(240, 186, 99, 0.62); border-radius: 18px; box-shadow: 0 10px 28px rgba(0,0,0,.42); }
    .summary-copy p { margin: 7px 0 9px; color: #eee5d2; font-size: 16px; line-height: 1.45; }
    .summary-copy strong { color: #f0ba63; }
    .eyebrow { color: #f7dc82; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
    .story-warning { display: block; margin-top: 8px; color: #ffc5ba; }
    .actions { display: flex; width: min(260px, 100%); flex-direction: column; gap: 9px; }
    .actions button { min-height: 44px; padding: 10px 16px; cursor: pointer; border-radius: 999px; font-weight: 900; }
    .start { color: #160f06; background: #f0ba63; border: 2px solid #ffe0a2; box-shadow: 0 0 22px rgba(240, 186, 99, 0.3); }
    .secondary { color: #fff0bb; background: rgba(43, 37, 29, 0.9); border: 1px solid rgba(240, 186, 99, 0.55); }
    .actions button:hover, .actions button:focus-visible { filter: brightness(1.08); outline: 2px solid #fff0bb; outline-offset: 2px; }
    .state { min-height: 210px; display: grid; place-items: center; padding: 30px; color: #e8dfcb; background: rgba(29, 27, 23, 0.78); border: 1px solid rgba(214, 193, 122, 0.28); border-radius: 16px; text-align: center; }
    .state h2 { margin: 0 0 14px; color: #fff0bb; }
    .state a { color: #f0ba63; font-weight: 800; }
    .state.error, .state.invalid { color: #ffd3cd; border-color: rgba(255, 112, 95, 0.5); }

    @media (max-width: 820px) {
        .artist-summary { grid-template-columns: 86px minmax(0, 1fr); }
        .artist-summary > img { width: 86px; height: 86px; }
        .actions { grid-column: 1 / -1; width: 100%; }
    }

    @media (max-width: 480px) {
        .artist-summary { grid-template-columns: 1fr; text-align: center; }
        .artist-summary > img { margin: 0 auto; }
    }
</style>
