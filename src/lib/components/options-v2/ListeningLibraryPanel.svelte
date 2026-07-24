<script lang="ts">

    import {goto} from '$app/navigation';

    type LibraryMode = 'nostalgia' | 'collections' | 'artists';

    type OptionItem = {
        id: string;
        label: string;
    };

    type CollectionGroup = {
        slug: string;
        name: string;
        items: {
            slug: string;
            name: string;
        }[];
    };

    type ArtistSpotlightItem = {
        artist_id: number;
        artist_name: string;
        genre_track_count: number;
        total_track_count: number;
        has_story: boolean;
    };

    type ArtistStoryInfo = {
        ok: boolean;
        has_story: boolean;
        story_id?: number;
        artist_id?: number;
        title?: string;
        story_type?: string;
        duration_seconds?: number;
        tts_bucket?: string;
        tts_key?: string;
        has_youtube_video?: boolean;
        youtube_video_id?: string;
        youtube_url?: string;
    };

    type ArtistTrackItem = {
        track_id: number;
        track_name: string;
        spotify_track_id: string;
        duration_ms: number;
        artist_id: number;
        artist_name: string;
    };

    type DocuseriesCollection = {
        id: number;
        slug: string;
        name: string;
        description?: string;
        sort_order: number;
    };

    type DocuseriesItem = {
        id: number;
        slug: string;
        title: string;
        short_description?: string | null;
        artwork_url?: string | null;
        target_length?: string | null;
        sort_order: number;
    };

    let selectedArtist: ArtistSpotlightItem | null = null;
    let artistTracks: ArtistTrackItem[] = [];
    let artistTracksLoading = false;
    let artistTracksError: string | null = null;
    let artistStoryInfo: ArtistStoryInfo | null = null;
    let artistRange = 'A-D';

    let artistSpotlightItems: ArtistSpotlightItem[] = [];
    let artistSpotlightLoading = false;
    let artistSpotlightError: string | null = null;

    let docuseriesCollections: DocuseriesCollection[] = [];
    let selectedDocuseriesCollection: string | null = null;
    let docuseriesItems: DocuseriesItem[] = [];
    let docuseriesLoading = false;
    let docuseriesError: string | null = null;

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    export let decadeOptions: OptionItem[] = [];
    export let genreOptions: OptionItem[] = [];
    export let collectionGroups: CollectionGroup[] = [];

    export let language = 'en';
    export let languages: string[] = ['en'];
    export let voices: string[] = ['intro'];
    export let playbackOrder = 'up';
    export let voicePlayMode = 'before';
    export let pauseMode = 'pause';
    export let skipPlayed = false;
    export let onActivate: (() => void) | undefined = undefined;
    export let collapsed = false;
    export let initialTab: LibraryMode = 'nostalgia';
    export let initialDocuseriesCollection: string | null = null;

    export let title = 'TopSpot40 Listening Library';
    export let description = 'Browse saved programs and curated collections.';

    let libraryMode: LibraryMode = 'nostalgia';

    let appliedInitialTab = false;

    $: if (!appliedInitialTab && initialTab) {
        libraryMode = initialTab;
        appliedInitialTab = true;

        if (initialTab === 'artists' && artistSpotlightItems.length === 0) {
            loadArtistSpotlights('all');
        }

        if (initialTab === 'collections' && initialDocuseriesCollection) {
            selectedCollectionGroup = 'music_docuseries';
            void restoreDocuseriesSelection(initialDocuseriesCollection);
        }
    }

    let selectedDecade: string | null = null;
    let selectedCollectionGroup: string | null = null;
    let selectedArtistGenre: string | null = 'all';
    let artistCategory = 'featured';

    $: filteredArtists = artistSpotlightItems
        .filter((artist) => {

            // Category filter
            if (artistCategory === 'featured' && !artist.has_story) return false;
            if (artistCategory === 'other' && artist.has_story) return false;
            if (artistCategory === 'single' && artist.total_track_count !== 1) return false;

            // Alphabet filter
            const first = artist.artist_name.charAt(0).toUpperCase();

            if (artistRange === 'A-D') return first >= 'A' && first <= 'D';
            if (artistRange === 'E-H') return first >= 'E' && first <= 'H';
            if (artistRange === 'I-L') return first >= 'I' && first <= 'L';
            if (artistRange === 'M-P') return first >= 'M' && first <= 'P';
            if (artistRange === 'Q-T') return first >= 'Q' && first <= 'T';
            if (artistRange === 'U-Z') return first >= 'U' && first <= 'Z';

            return false;
        })
        .sort((a, b) =>
            titleCaseName(a.artist_name).localeCompare(titleCaseName(b.artist_name))
        );

    async function loadArtistTracks(artist: ArtistSpotlightItem) {
        selectedArtist = artist;
        artistTracks = [];
        artistStoryInfo = null;
        artistTracksError = null;
        artistTracksLoading = true;

        try {
            const res = await fetch(
                `${API_BASE}/artist-spotlight/artist-tracks?artist_id=${artist.artist_id}`
            );

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            artistTracks = await res.json();

            const storyRes = await fetch(
                `${API_BASE}/artist-spotlight/artist-story?artist_id=${artist.artist_id}&language=${language}`
            );

            if (storyRes.ok) {
                artistStoryInfo = await storyRes.json();
            }
        } catch (err) {
            artistTracksError = err instanceof Error ? err.message : 'Failed to load artist tracks.';
        } finally {
            artistTracksLoading = false;
        }
    }

    function titleCaseName(name: string): string {
        return name.replace(/\b\w/g, c => c.toUpperCase());
    }

    function documentaryButtonLabel(
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

    async function loadArtistSpotlights(
        genreId: string,
        featured: boolean = artistCategory === 'featured',
        minTracks: number = 2,
        maxTracks: number | null = null
    ) {
        selectedArtistGenre = genreId;
        artistSpotlightItems = [];
        artistSpotlightError = null;
        artistSpotlightLoading = true;

        try {
            const maxTracksParam =
                maxTracks !== null ? `&max_tracks=${maxTracks}` : '';

            const res = await fetch(
                `${API_BASE}/artist-spotlight/artists-by-genre` +
                `?genre=${genreId}` +
                `&min_tracks=${minTracks}` +
                maxTracksParam +
                `&featured_only=${featured}`
            );

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            artistSpotlightItems = await res.json();
        } catch (err) {
            artistSpotlightError = err instanceof Error ? err.message : 'Failed to load artists.';
        } finally {
            artistSpotlightLoading = false;
        }
    }

    async function loadDocuseriesCollections() {
        docuseriesLoading = true;
        docuseriesError = null;
        docuseriesItems = [];
        selectedDocuseriesCollection = null;

        try {
            const res = await fetch(`${API_BASE}/music-docuseries/collections`);

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            docuseriesCollections = await res.json();
        } catch (err) {
            docuseriesError = err instanceof Error ? err.message : 'Failed to load Music Docuseries.';
        } finally {
            docuseriesLoading = false;
        }
    }

    async function loadDocuseriesItems(collectionSlug: string) {
        selectedDocuseriesCollection = collectionSlug;
        docuseriesLoading = true;
        docuseriesError = null;
        docuseriesItems = [];

        try {
            const res = await fetch(
                `${API_BASE}/music-docuseries/items?collection_slug=${collectionSlug}`
            );

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            docuseriesItems = await res.json();
        } catch (err) {
            docuseriesError = err instanceof Error ? err.message : 'Failed to load Docuseries items.';
        } finally {
            docuseriesLoading = false;
        }
    }

    async function restoreDocuseriesSelection(
        collectionSlug: string
    ): Promise<void> {
        selectedCollectionGroup = 'music_docuseries';
        await loadDocuseriesCollections();
        await loadDocuseriesItems(collectionSlug);
    }

</script>

<div class="library-card">
    <div
            class="section-header-row section-header-clickable"
            role="button"
            tabindex="0"
            on:click={() => {
                onActivate?.();
            }}
            on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onActivate?.();
                }
            }}
    >
        <h3 class="section-title">🎧 {title} 🎧</h3>
        <span class="section-toggle">{collapsed ? '▼' : '▲'}</span>
    </div>

    <div class="library-description">
        {description}
    </div>

    {#if !collapsed}


        <div class="library-description">
            {description}
        </div>

        <div class="library-buttons">
            <button
                    class:active={!collapsed && libraryMode === 'nostalgia'}
                    on:click|stopPropagation={() => {
            if (collapsed) onActivate?.();
            libraryMode = 'nostalgia';
        }}
            >
                Nostalgia Programs
            </button>

            <button
                    class:active={!collapsed && libraryMode === 'collections'}
                    on:click|stopPropagation={() => {
            if (collapsed) onActivate?.();
            libraryMode = 'collections';
        }}
            >
                Collections Programs
            </button>

            <button
                    class:active={!collapsed && libraryMode === 'artists'}
                    on:click|stopPropagation={() => {
                        if (collapsed) onActivate?.();
                        libraryMode = 'artists';

                        if (artistSpotlightItems.length === 0) {
                            loadArtistSpotlights('all');
                        }
                    }}
            >
                Artist Spotlight
            </button>
        </div>

        <div class="library-separator">
        <span>
            {#if libraryMode === 'nostalgia'}
                Decades & Genres
            {:else if libraryMode === 'collections'}
                Collection Groups
            {:else}
                Featured Artists
            {/if}
        </span>
        </div>


        <div class="library-placeholder">
            {#if libraryMode === 'nostalgia'}

                <div class="decade-grid">

                    {#each decadeOptions as decade}
                        <button
                                class:selected={selectedDecade === decade.id}
                                on:click={() => selectedDecade = decade.id}
                        >
                            {decade.label}
                        </button>
                    {/each}

                </div>

                {#if selectedDecade}

                    <div class="genre-section">

                        <div class="genre-title">
                            {selectedDecade === 'ALL'
                                ? 'All Genres • Select a Genre to Start Listening'
                                : `${selectedDecade} Genres • Select a Genre to Start Listening`}
                        </div>

                        <div class="genre-grid">
                            {#each genreOptions as genre}
                                <button
                                        class="genre-btn"
                                        on:click={() => {
            const params = new URLSearchParams({
                mode: 'decade_genre',
                decade: selectedDecade ?? '',
                genre: genre.id,
                language,
                languages: languages.join(','),
                voices: voices.join(','),
                playbackOrder,
                voicePlayMode,
                pauseMode,
                skipPlayed: String(skipPlayed)
            });

goto(`/car-page?${params.toString()}`);
                }}
                                >
                                    {selectedDecade === 'ALL'
                                        ? `All Decades • ${genre.label}`
                                        : `${selectedDecade} • ${genre.label}`
                                    }
                                </button>
                            {/each}
                        </div>

                    </div>

                {/if}

            {:else if libraryMode === 'collections'}

                <div class="decade-grid">

                    {#each collectionGroups as group}
                        <button
                                class:selected={selectedCollectionGroup === group.slug}
                                on:click={() => selectedCollectionGroup = group.slug}
                        >
                            {group.name}
                        </button>
                    {/each}

                    <button
                            class:selected={selectedCollectionGroup === 'music_docuseries'}
                            on:click={() => {
                                selectedCollectionGroup = 'music_docuseries';
                                loadDocuseriesCollections();
                            }}
                    >
                        🎙 Music Docuseries
                    </button>

                </div>

                {#if selectedCollectionGroup === 'music_docuseries'}

                    <div class="genre-section">

                        <div class="genre-title">
                            Music Docuseries Collections • Select a Collection
                        </div>

                        {#if docuseriesLoading}
                            <div class="library-description">
                                Loading Music Docuseries...
                            </div>
                        {:else if docuseriesError}
                            <div class="library-description">
                                {docuseriesError}
                            </div>
                        {:else}
                            <div class="genre-grid">
                                {#each docuseriesCollections as collection}
                                    <button
                                            class="genre-btn"
                                            class:selected={selectedDocuseriesCollection === collection.slug}
                                            on:click={() => loadDocuseriesItems(collection.slug)}
                                    >
                                        {collection.name}
                                    </button>
                                {/each}
                            </div>

                            {#if docuseriesItems.length}
                                <div class="genre-title" style="margin-top:16px;">
                                    {docuseriesCollections.find(c => c.slug === selectedDocuseriesCollection)?.name}
                                    • Select a Story
                                </div>

                                <div class="genre-grid">
                                    {#each docuseriesItems as item}
                                        <button
                                                class="genre-btn"
                                                on:click={() => {
                                    goto(
                                        `/story-player?type=music_docuseries` +
                                        `&slug=${item.slug}` +
                                        `&language=${language === 'ptbr' ? 'pt-BR' : language}` +
                                        `&collection=${encodeURIComponent(selectedDocuseriesCollection ?? '')}`
                                    );
                                }}
                                        >
                                            {item.title}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        {/if}

                    </div>

                {:else if selectedCollectionGroup && selectedCollectionGroup !== 'ALL'}

                    <div class="genre-section">

                        <div class="genre-title">
                            {collectionGroups.find(g => g.slug === selectedCollectionGroup)?.name}
                            Collections • Select a Collection to Start Listening
                        </div>

                        <div class="genre-grid">
                            {#each collectionGroups.find(g => g.slug === selectedCollectionGroup)?.items ?? [] as collection}
                                <button
                                        class="genre-btn"
                                        on:click={() => {
                            goto(
                                `/car-page?mode=collection` +
                                `&collection=${collection.slug}` +
                                `&collection_group=${selectedCollectionGroup}` +
                                `&language=${language}` +
                                `&languages=${languages.join(',')}` +
                                `&voices=${voices.join(',')}` +
                                `&playbackOrder=${playbackOrder}` +
                                `&voicePlayMode=${voicePlayMode}` +
                                `&pauseMode=${pauseMode}` +
                                `&skipPlayed=${skipPlayed}`
                            );
                        }}
                                >
                                    {collection.name}
                                </button>
                            {/each}
                        </div>

                    </div>

                {/if}


            {:else}

                <div class="library-buttons artist-category-buttons">
                    <button
                            class:selected={artistCategory === 'featured'}
                            on:click={() => {
                                artistCategory = 'featured';
                                loadArtistSpotlights(selectedArtistGenre ?? 'all');
                            }}
                    >
                        ⭐ Featured Artists
                    </button>

                    <button
                            class:selected={artistCategory === 'other'}
                            on:click={() => {
                                artistCategory = 'other';
                                loadArtistSpotlights(selectedArtistGenre ?? 'all', false, 2, null);
                            }}
                    >
                        🎵 Other Artists
                    </button>

                    <button
                            class:selected={artistCategory === 'single'}
                            on:click={() => {
                                artistCategory = 'single';
                                loadArtistSpotlights(selectedArtistGenre ?? 'all', false, 1, 1);
                            }}
                    >
                        🎵 Single Track Artists
                    </button>
                </div>

                <div class="alphabet-grid" style="margin-bottom:12px;">

                    <button
                            class:selected={artistRange === 'A-D'}
                            on:click={() => artistRange = 'A-D'}
                    >
                        A-D
                    </button>

                    <button
                            class:selected={artistRange === 'E-H'}
                            on:click={() => artistRange = 'E-H'}
                    >
                        E-H
                    </button>

                    <button
                            class:selected={artistRange === 'I-L'}
                            on:click={() => artistRange = 'I-L'}
                    >
                        I-L
                    </button>

                    <button
                            class:selected={artistRange === 'M-P'}
                            on:click={() => artistRange = 'M-P'}
                    >
                        M-P
                    </button>

                    <button
                            class:selected={artistRange === 'Q-T'}
                            on:click={() => artistRange = 'Q-T'}
                    >
                        Q-T
                    </button>

                    <button
                            class:selected={artistRange === 'U-Z'}
                            on:click={() => artistRange = 'U-Z'}
                    >
                        U-Z
                    </button>
                </div>

                <div class="genre-title">
                    Browse All Artists or Filter by Genre
                </div>

                <div class="genre-grid">
                    <button
                            class="genre-btn"
                            class:selected={selectedArtistGenre === 'all'}
                            on:click={() => loadArtistSpotlights('all')}
                    >
                        All Genres
                    </button>

                    {#each genreOptions.filter(g => g.id !== 'tv_themes') as genre}

                        <button
                                class="genre-btn"
                                class:selected={selectedArtistGenre === genre.id}
                                on:click={() => loadArtistSpotlights(genre.id)}
                        >
                            {genre.label}
                        </button>

                    {/each}
                </div>
                {#if selectedArtistGenre}

                    <div class="genre-section">

                        <div class="genre-title">
                            {#if artistCategory === 'featured'}
                                Featured Artists
                            {:else if artistCategory === 'other'}
                                Other Artists
                            {:else}
                                Single Track Artists
                            {/if}
                            • Select an Artist to Start Listening
                        </div>

                        {#if artistSpotlightLoading}

                            <div class="library-description">
                                Loading artists...
                            </div>

                        {:else if artistSpotlightError}

                            <div class="library-description">
                                {artistSpotlightError}
                            </div>

                        {:else}

                            {#if selectedArtist}

                                <div class="genre-section">

                                    <button
                                            class="back-btn"
                                            on:click={() => {
                                selectedArtist = null;
                                artistTracks = [];
                            }}
                                    >
                                        ← Back to Artists
                                    </button>

                                    <div class="spotlight-artist-title">
                                        Spotlight Artist
                                    </div>

                                    <div class="spotlight-artist-name">
                                        {titleCaseName(selectedArtist.artist_name)}
                                    </div>

                                    <div class="artist-play-row">

                                        {#if artistStoryInfo?.has_story}
                                            <button
                                                    class="play-artist-btn"
                                                    on:click={() => {
                    const artist = selectedArtist;
                    if (!artist) return;

                    goto(
                        `/story-player?type=artist_story` +
                        `&artist_id=${artist.artist_id}` +
                        `&artist=${encodeURIComponent(artist.artist_name)}` +
                        `&genre=${encodeURIComponent(selectedArtistGenre ?? '')}` +
                        `&language=${language}`
                    );
                }}
                                            >
                                                ▶ Play Artist Story
                                                {artistStoryInfo.duration_seconds
                                                    ? ` (${Math.max(1, Math.round(artistStoryInfo.duration_seconds / 60))} min)`
                                                    : ''}
                                            </button>
                                        {/if}

                                        <button
                                                class="play-artist-btn"
                                                on:click={() => {
                const artist = selectedArtist;
                if (!artist) return;

                goto(
                    `/car-page?mode=artist_spotlight` +
                    `&artist_id=${artist.artist_id}` +
                    `&artist=${encodeURIComponent(artist.artist_name)}` +
                    `&genre=${encodeURIComponent(selectedArtistGenre ?? '')}` +
                        `&language=${language}`
                );
            }}
                                        >
                                            ▶ Play Artist Spotlight
                                        </button>

                                        {#if
                                            artistStoryInfo?.has_youtube_video &&
                                            artistStoryInfo.youtube_url
                                        }
                                            <button
                                                class="play-artist-btn"
                                                on:click={() => {
                                                    const url =
                                                        artistStoryInfo?.youtube_url;

                                                    if (url) {
                                                        window.open(
                                                            url,
                                                            '_blank',
                                                            'noopener,noreferrer'
                                                        );
                                                    }
                                                }}
                                            >
                                                {documentaryButtonLabel(language)}
                                            </button>
                                        {/if}

                                    </div>
                                    {#if artistTracksLoading}
                                        <div class="library-description">Loading tracks...</div>
                                    {:else if artistTracksError}
                                        <div class="library-description">{artistTracksError}</div>
                                    {:else}
                                        <div class="track-grid">
                                            {#each artistTracks as track}
                                                <button class="track-btn">
                                                    <div class="track-name">
                                                        {titleCaseName(track.track_name)}
                                                    </div>
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}

                                </div>

                            {:else}

                                <div class="artist-grid">
                                    {#each filteredArtists as artist}
                                        <button
                                                class="artist-btn"
                                                on:click={() => loadArtistTracks(artist)}
                                        >
                                            <div class="artist-name">
                                                {#if artist.has_story}
                                                    <span class="story-star">⭐</span>
                                                {/if}
                                                {titleCaseName(artist.artist_name)}
                                            </div>
                                            <div class="artist-count">
                                                {#if selectedArtistGenre === 'all'}
                                                    {artist.total_track_count} Total
                                                {:else}
                                                    {artist.genre_track_count}
                                                    {genreOptions.find(g => g.id === selectedArtistGenre)?.label}
                                                    •
                                                    {artist.total_track_count} Total
                                                {/if}
                                            </div>
                                        </button>
                                    {/each}
                                </div>

                            {/if}

                        {/if}
                    </div>

                {/if}

            {/if}
        </div>
    {/if}
</div>

<style>
    .library-card {
        background: rgba(18, 18, 18, 0.95);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        margin-top: 16px;
        margin-bottom: 16px;
    }

    .section-title {
        font-size: 0.78rem;
        color: #cfb87c;
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
    }

    .library-description {
        font-size: 0.8rem;
        color: #aaa;
        margin-bottom: 0.5rem;
        line-height: 1.3;
    }

    .library-buttons button.active,
    .library-buttons button.selected {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }

    .library-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 12px;
    }

    .library-buttons button {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .library-buttons button.active {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }

    .library-separator {
        display: flex;
        align-items: center;
        margin: 10px 0 12px;
    }

    .library-separator::before,
    .library-separator::after {
        content: '';
        flex: 1;
        border-top: 1px dashed rgba(207, 184, 124, 0.35);
    }

    .library-separator span {
        padding: 0 8px;
        font-size: 0.7rem;
        color: rgba(207, 184, 124, 0.7);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .library-placeholder {
        padding: 10px;
        border-radius: 10px;
        background: rgba(207, 184, 124, 0.06);
        border: 1px dashed rgba(207, 184, 124, 0.25);
        color: #bbb;
        font-size: 0.82rem;
        text-align: center;
    }

    .decade-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
    }

    .decade-grid button {
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ddd;
        padding: 7px 10px;
        cursor: pointer;
        font-size: 0.82rem;
    }

    .decade-grid button.selected {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 700;
    }

    .all-decades-btn {
        grid-column: 1 / -1;
    }

    .genre-section {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px dashed rgba(207, 184, 124, 0.25);
    }

    .genre-title {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(207, 184, 124, 0.75);
        margin-bottom: 10px;
    }

    .genre-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
    }

    .genre-btn {
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ddd;
        padding: 7px 10px;
        cursor: pointer;
        font-size: 0.82rem;
        transition: all 0.18s ease;
    }

    .genre-btn:hover {
        border-color: #cfb87c;
        color: #fff;
        background: #333;
    }

    .genre-btn.selected {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 700;
    }

    .artist-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 16px;
    }

    .artist-btn {
        background: #2b2b2b;
        border: 1px solid #444;
        border-radius: 12px;
        padding: 14px 18px;
        text-align: left;
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .artist-btn:hover {
        border-color: #d4b870;
        background: #333;
    }

    .artist-name {
        font-size: 1rem;
        font-weight: 600;
        color: #f5f5f5;
    }

    .artist-count {
        margin-top: 4px;
        font-size: 0.85rem;
        color: #c9b26d;
    }

    .track-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-top: 14px;
    }

    .track-btn {
        background: #252525;
        border: 1px solid #3f3f3f;
        border-radius: 10px;
        padding: 10px 14px;
        text-align: left;
        cursor: pointer;
        transition: all 0.18s ease;
    }

    .track-btn:hover {
        border-color: #cfb87c;
        background: #303030;
    }

    .track-name {
        font-size: 0.9rem;
        color: #eee;
    }

    .artist-play-row {
        margin-bottom: 14px;
    }

    .back-btn {
        background: transparent;
        color: #cfb87c;
        border: 1px solid rgba(207, 184, 124, 0.45);
        border-radius: 999px;
        padding: 6px 14px;
        margin-bottom: 12px;
        cursor: pointer;
    }

    .play-artist-btn {
        background: #cfb87c;
        color: #000;
        border: none;
        border-radius: 999px;
        padding: 8px 18px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.18s ease;
    }

    .play-artist-btn:hover {
        filter: brightness(1.05);
    }

    .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .section-title {
        margin: 0;
    }

    .section-toggle {
        color: #cfb87c;
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1;
        opacity: 0.95;
    }

    .section-header-clickable {
        cursor: pointer;
    }

    .spotlight-artist-title {
        text-align: center;
        color: #cfb87c;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 6px;
    }

    .spotlight-artist-name {
        text-align: center;
        color: #ffffff;
        font-size: 2.2rem; /* was 2.0 */
        font-weight: 800;
        margin-bottom: 18px; /* was 14 */
    }

    .story-star {
        margin-right: 6px;
    }

    .alphabet-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
        margin-bottom: 12px;
    }

    .alphabet-grid button {
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ddd;
        padding: 7px 10px;
        cursor: pointer;
        font-size: 0.82rem;
    }

    .alphabet-grid button.selected {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 700;
    }

    .artist-category-buttons {
        margin-bottom: 12px;
    }

    .artist-category-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 12px;
        width: 100%;
    }

</style>