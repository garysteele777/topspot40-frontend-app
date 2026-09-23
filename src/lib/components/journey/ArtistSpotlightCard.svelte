<script lang="ts">
    import {ARTIST_SPOTLIGHT_FALLBACK_ARTWORK} from '$lib/config/artistSpotlightsJourney';
    import {titleCaseArtistName} from '$lib/artistSpotlights/catalogAdapter';
    import type {ArtistSpotlightItem} from '$lib/artistSpotlights/types';

    export let artist: ArtistSpotlightItem;
    export let href: string;
    export let genreLabel = 'All Genres';

    let imageFailed = false;

    $: artwork = artist.artist_artwork ?? artist.artwork_url ?? null;
    $: displayName = titleCaseArtistName(artist.artist_name);
    $: initial = displayName.charAt(0).toUpperCase() || '♪';
</script>

<a class="spotlight-card" {href}>
    <span class="artwork">
        {#if artwork && !imageFailed}
            <img src={artwork} alt="" on:error={() => imageFailed = true}/>
        {:else}
            <img class="fallback-texture" src={ARTIST_SPOTLIGHT_FALLBACK_ARTWORK} alt=""/>
            <span class="fallback-shade" aria-hidden="true"></span>
            <span class="monogram" aria-hidden="true">{initial}</span>
            <span class="microphone" aria-hidden="true">🎙</span>
        {/if}
        {#if artist.has_story}<span class="story-badge">★ Story</span>{/if}
    </span>

    <span class="card-copy">
        <strong>{displayName}</strong>
        <span class="counts">
            {#if genreLabel === 'All Genres'}
                {artist.total_track_count} {artist.total_track_count === 1 ? 'track' : 'tracks'}
            {:else}
                {artist.genre_track_count} in {genreLabel}<span aria-hidden="true"> • </span>{artist.total_track_count} total
            {/if}
        </span>
        <span class="open">View Artist Spotlight <span aria-hidden="true">→</span></span>
    </span>
</a>

<style>
    .spotlight-card { display: grid; grid-template-columns: 116px minmax(0, 1fr); min-height: 150px; overflow: hidden; color: #fff; background: linear-gradient(135deg, rgba(49, 42, 31, 0.98), rgba(23, 22, 20, 0.98)); border: 1px solid rgba(240, 186, 99, 0.38); border-radius: 18px; text-decoration: none; transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease; }
    .spotlight-card:hover, .spotlight-card:focus-visible { transform: translateY(-3px); border-color: #f0ba63; outline: none; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45), 0 0 22px rgba(240, 186, 99, 0.16); }
    .artwork { position: relative; display: grid; min-height: 150px; place-items: center; overflow: hidden; background: #271d11; }
    .artwork img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .fallback-texture { opacity: 0.26; filter: sepia(0.7) contrast(1.1); }
    .fallback-shade { position: absolute; inset: 0; background: radial-gradient(circle at 50% 38%, rgba(240,186,99,.16), rgba(15,8,2,.92)); }
    .monogram { position: relative; z-index: 1; color: #f7dc82; font-family: Georgia, serif; font-size: 58px; font-weight: 900; text-shadow: 0 4px 14px #000; }
    .microphone { position: absolute; z-index: 1; right: 8px; bottom: 8px; font-size: 20px; }
    .story-badge { position: absolute; z-index: 2; top: 8px; left: 8px; padding: 4px 7px; color: #241609; background: #f7dc82; border-radius: 999px; font-size: 11px; font-weight: 900; }
    .card-copy { display: flex; min-width: 0; padding: 20px; flex-direction: column; justify-content: center; }
    .card-copy strong { color: #fff0bb; font-family: Georgia, serif; font-size: clamp(20px, 2vw, 27px); line-height: 1.08; }
    .counts { margin-top: 9px; color: #d4cbb7; font-size: 14px; line-height: 1.35; }
    .open { margin-top: 17px; color: #f0ba63; font-size: 13px; font-weight: 900; }

    @media (max-width: 540px) {
        .spotlight-card { grid-template-columns: 92px minmax(0, 1fr); min-height: 128px; }
        .artwork { min-height: 128px; }
        .card-copy { padding: 15px; }
        .monogram { font-size: 46px; }
        .open { margin-top: 11px; }
    }
</style>
