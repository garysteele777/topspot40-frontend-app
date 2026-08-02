<script lang="ts">
    import {
        MUSIC_DOCUSERIES_FALLBACK_ARTWORK,
        formatTargetLength
    } from '$lib/config/musicDocuseriesJourney';
    import type {MusicDocuseriesStory} from '$lib/musicDocuseries/types';

    export let story: MusicDocuseriesStory;
    export let collectionSlug: string;
    export let episodeNumber: number;
    export let openLabel = 'Preview story';

    let imageFailed = false;
    $: href = `/journey-prototype/music-docuseries/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(story.slug)}`;
    $: targetLength = formatTargetLength(story.target_length);
</script>

<a class="story-card" {href}>
    <span class="artwork">
        <img class:fallback={!story.artwork_url || imageFailed} src={!imageFailed && story.artwork_url ? story.artwork_url : MUSIC_DOCUSERIES_FALLBACK_ARTWORK} alt="" on:error={() => imageFailed = true}/>
        <span class="shade" aria-hidden="true"></span>
        <span class="episode">{episodeNumber}</span>
    </span>
    <span class="copy">
        <small>Story {episodeNumber}{targetLength ? ` • ${targetLength}` : ''}</small>
        <strong>{story.title}</strong>
        {#if story.short_description}<span class="description">{story.short_description}</span>{/if}
        <span class="open">{openLabel} <span aria-hidden="true">→</span></span>
    </span>
</a>

<style>
    .story-card { display: grid; grid-template-columns: 150px minmax(0, 1fr); min-height: 170px; overflow: hidden; color: #fff; background: linear-gradient(135deg, rgba(43,38,29,.98), rgba(20,20,19,.98)); border: 1px solid rgba(215,166,74,.36); border-radius: 18px; text-decoration: none; transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease; }
    .story-card:hover, .story-card:focus-visible { transform: translateY(-2px); border-color: #d7a64a; outline: none; box-shadow: 0 12px 28px rgba(0,0,0,.42); }
    .artwork { position: relative; min-height: 170px; overflow: hidden; background: #21190d; }
    .artwork img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .artwork img.fallback { filter: sepia(.8) contrast(1.05); opacity: .58; }
    .shade { position: absolute; inset: 0; background: linear-gradient(135deg, transparent, rgba(9,6,2,.68)); }
    .episode { position: absolute; left: 12px; bottom: 12px; display: grid; width: 38px; height: 38px; place-items: center; color: #211509; background: #f7dc82; border-radius: 50%; font-family: Georgia, serif; font-size: 19px; font-weight: 900; box-shadow: 0 5px 15px rgba(0,0,0,.45); }
    .copy { display: flex; min-width: 0; padding: 20px; flex-direction: column; justify-content: center; }
    .copy small { color: #d7a64a; font-size: 11px; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
    .copy strong { margin-top: 7px; color: #fff0bb; font-family: Georgia, serif; font-size: clamp(20px, 2vw, 27px); line-height: 1.12; }
    .description { display: -webkit-box; margin-top: 8px; overflow: hidden; color: #d8d0c1; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
    .open { margin-top: 14px; color: #d7a64a; font-size: 13px; font-weight: 900; }

    @media (max-width: 540px) {
        .story-card { grid-template-columns: 104px minmax(0, 1fr); min-height: 145px; }
        .artwork { min-height: 145px; }
        .copy { padding: 15px; }
    }
</style>
