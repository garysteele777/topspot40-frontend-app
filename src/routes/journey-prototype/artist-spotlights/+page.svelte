<script lang="ts">
    import {afterNavigate, goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import ProgramJourneyShell from '$lib/components/journey/ProgramJourneyShell.svelte';
    import ArtistSpotlightFilters from '$lib/components/journey/ArtistSpotlightFilters.svelte';
    import ArtistSpotlightCard from '$lib/components/journey/ArtistSpotlightCard.svelte';
    import {
        loadArtistSpotlightGenres,
        loadArtistSpotlightsForCategory,
        titleCaseArtistName
    } from '$lib/artistSpotlights/catalogAdapter';
    import {
        ARTIST_CATEGORY_PRESENTATION,
        ARTIST_SPOTLIGHTS_ACCENT,
        ARTIST_SPOTLIGHTS_JOURNEY_ARTWORK
    } from '$lib/config/artistSpotlightsJourney';
    import {ARTIST_ALPHABET_RANGES} from '$lib/artistSpotlights/types';
    import type {
        ArtistAlphabetRange,
        ArtistGenreOption,
        ArtistSpotlightBrowserState,
        ArtistSpotlightCategory,
        ArtistSpotlightItem
    } from '$lib/artistSpotlights/types';
    import type {Language} from '$lib/types/playback';

    let language: Language = 'en';
    let genres: ArtistGenreOption[] = [];
    let artists: ArtistSpotlightItem[] = [];
    let state: ArtistSpotlightBrowserState = {
        category: 'featured',
        range: 'A-B',
        genre: 'all'
    };
    let loading = true;
    let errorMessage: string | null = null;
    let initialized = false;
    let lastRequestKey = '';
    let requestNumber = 0;

    const categories: ArtistSpotlightCategory[] = ['featured', 'other', 'single'];

    function readLanguage(): Language {
        const saved = localStorage.getItem('topspot_language');
        return saved === 'es' || saved === 'ptbr' ? saved : 'en';
    }

    function artistIsInRange(name: string, range: ArtistAlphabetRange): boolean {
        const first = name.charAt(0).toUpperCase();
        const [start, end] = range.split('-');
        return first >= start && first <= end;
    }

    function categoryMatches(artist: ArtistSpotlightItem): boolean {
        if (state.category === 'featured') return artist.has_story;
        if (state.category === 'other') return !artist.has_story;
        return artist.total_track_count === 1;
    }

    function genreLabel(genre: string): string {
        if (genre === 'all') return 'All Genres';
        return genres.find(option => option.id === genre)?.label ?? genre;
    }

    function normalizedState(url: URL): ArtistSpotlightBrowserState {
        const requestedCategory = url.searchParams.get('category');
        const requestedRange = url.searchParams.get('range');
        const requestedGenre = url.searchParams.get('genre');

        return {
            category: categories.includes(requestedCategory as ArtistSpotlightCategory)
                ? requestedCategory as ArtistSpotlightCategory
                : 'featured',
            range: ARTIST_ALPHABET_RANGES.includes(requestedRange as ArtistAlphabetRange)
                ? requestedRange as ArtistAlphabetRange
                : 'A-B',
            genre: requestedGenre === 'all' || genres.some(option => option.id === requestedGenre)
                ? requestedGenre ?? 'all'
                : 'all'
        };
    }

    async function loadArtists(): Promise<void> {
        const requestKey = `${state.category}|${state.genre}`;
        if (requestKey === lastRequestKey) return;

        lastRequestKey = requestKey;
        const activeRequest = ++requestNumber;
        loading = true;
        errorMessage = null;

        try {
            const result = await loadArtistSpotlightsForCategory(state.genre, state.category);
            if (activeRequest === requestNumber) artists = result;
        } catch (error) {
            if (activeRequest === requestNumber) {
                console.error('Failed to load Artist Spotlights:', error);
                artists = [];
                errorMessage = 'We could not load Artist Spotlights.';
            }
        } finally {
            if (activeRequest === requestNumber) loading = false;
        }
    }

    function applyUrl(url: URL, replaceInvalid = false): void {
        if (!initialized) return;

        const nextState = normalizedState(url);
        state = nextState;

        const normalized = new URL(url);
        normalized.searchParams.set('category', nextState.category);
        normalized.searchParams.set('range', nextState.range);
        normalized.searchParams.set('genre', nextState.genre);

        if (replaceInvalid && normalized.search !== url.search) {
            void goto(`${normalized.pathname}${normalized.search}`, {replaceState: true, noScroll: true});
        }

        void loadArtists();
    }

    function updateState(changes: Partial<ArtistSpotlightBrowserState>): void {
        const next = {...state, ...changes};
        const url = new URL(window.location.href);
        url.searchParams.set('category', next.category);
        url.searchParams.set('range', next.range);
        url.searchParams.set('genre', next.genre);
        void goto(`${url.pathname}${url.search}`, {keepFocus: true, noScroll: true});
    }

    function artistHref(artist: ArtistSpotlightItem): string {
        const query = new URLSearchParams({
            category: state.category,
            range: state.range,
            genre: state.genre
        });
        return `/journey-prototype/artist-spotlights/${artist.artist_id}?${query.toString()}`;
    }

    afterNavigate(({to}) => {
        if (to) applyUrl(to.url);
    });

    onMount(async () => {
        language = readLanguage();

        try {
            genres = await loadArtistSpotlightGenres();
            initialized = true;
            applyUrl(new URL(window.location.href), true);
        } catch (error) {
            console.error('Failed to load Artist Spotlight genres:', error);
            loading = false;
            errorMessage = 'We could not load the Artist Spotlight catalog.';
        }
    });

    $: filteredArtists = artists
        .filter(categoryMatches)
        .filter(artist => artistIsInRange(artist.artist_name, state.range))
        .sort((a, b) => titleCaseArtistName(a.artist_name).localeCompare(titleCaseArtistName(b.artist_name)));
</script>

<svelte:head>
    <title>Artist Spotlights | TopSpot40</title>
    <meta name="description" content="Browse TopSpot40 Artist Spotlight programs by artist type, alphabet, and genre."/>
</svelte:head>

<ProgramJourneyShell
    {language}
    title="Choose an Artist Spotlight"
    instruction="Filter the TopSpot40 artist library, then choose an artist to preview their program."
    backHref="/journey-prototype/choose"
    backLabel="Back"
    homeLabel="Home"
    accent={ARTIST_SPOTLIGHTS_ACCENT}
    artwork={ARTIST_SPOTLIGHTS_JOURNEY_ARTWORK}
    artworkAlt="A grand music library illuminated for an Artist Spotlight journey"
>
    <ArtistSpotlightFilters
        category={state.category}
        range={state.range}
        genre={state.genre}
        {genres}
        onCategoryChange={(category) => updateState({category})}
        onRangeChange={(range) => updateState({range})}
        onGenreChange={(genre) => updateState({genre})}
    />

    <section class="results" aria-labelledby="artist-results-heading">
        <header>
            <div>
                <span class="eyebrow">{ARTIST_CATEGORY_PRESENTATION[state.category].label}</span>
                <h2 id="artist-results-heading">{state.range} Artists</h2>
            </div>
            <strong>{genreLabel(state.genre)}</strong>
        </header>

        {#if loading}
            <div class="state" aria-live="polite">Loading artists…</div>
        {:else if errorMessage}
            <div class="state error" role="alert">{errorMessage}</div>
        {:else if filteredArtists.length === 0}
            <div class="state">No artists match these filters. Try another alphabetical group or genre.</div>
        {:else}
            <div class="artist-grid">
                {#each filteredArtists as artist (artist.artist_id)}
                    <ArtistSpotlightCard
                        {artist}
                        href={artistHref(artist)}
                        genreLabel={genreLabel(state.genre)}
                    />
                {/each}
            </div>
        {/if}
    </section>
</ProgramJourneyShell>

<style>
    .results { margin-top: 24px; }
    .results > header { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .results h2 { margin: 3px 0 0; color: #fff0bb; font-family: Georgia, serif; font-size: 28px; }
    .results header strong { color: #f0ba63; }
    .eyebrow { color: #cfc3a8; font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
    .artist-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
    .state { min-height: 150px; display: grid; place-items: center; padding: 24px; color: #e8dfcb; background: rgba(29, 27, 23, 0.78); border: 1px solid rgba(214, 193, 122, 0.28); border-radius: 16px; text-align: center; }
    .state.error { color: #ffd3cd; border-color: rgba(255, 112, 95, 0.5); }

    @media (max-width: 760px) {
        .artist-grid { grid-template-columns: 1fr; }
        .results > header { align-items: start; flex-direction: column; }
    }
</style>
