<script lang="ts">
    import type {JourneyCollection} from '$lib/collections/types';
    import {localizedCollectionCopy} from '$lib/config/collectionsJourney';
    import type {Language} from '$lib/types/playback';

    export let collection: JourneyCollection;
    export let groupSlug: string;
    export let language: Language = 'en';
    export let openLabel = 'View collection';

    $: href = `/journey-prototype/collections/${encodeURIComponent(groupSlug)}/${encodeURIComponent(collection.slug)}`;
</script>

<a class="card" href={href} style={`--collection-accent: ${collection.presentation.accent}`}>
    <span class="icon" aria-hidden="true">{collection.presentation.icon}</span>
    <span class="copy">
        <strong>{collection.name}</strong>
        <small>{localizedCollectionCopy(collection.presentation.description, language)}</small>
        {#if collection.totalTracks > 0}
            <span class="track-count">{collection.totalTracks} tracks</span>
        {/if}
    </span>
    <span class="open">{openLabel} <span aria-hidden="true">→</span></span>
</a>

<style>
    .card {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        min-height: 126px;
        padding: 18px;
        color: #fff;
        background: rgba(35, 35, 35, 0.92);
        border: 1px solid rgba(214, 193, 122, 0.42);
        border-radius: 16px;
        text-decoration: none;
        transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
    }

    .card:hover,
    .card:focus-visible {
        transform: translateY(-2px);
        background: rgba(49, 49, 49, 0.98);
        border-color: var(--collection-accent);
        outline: none;
    }

    .icon {
        display: grid;
        width: 44px;
        height: 44px;
        place-items: center;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        font-size: 22px;
    }

    .copy,
    .copy strong,
    .copy small,
    .track-count {
        display: block;
    }

    .copy strong {
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: 20px;
    }

    .copy small {
        margin-top: 5px;
        color: #d8d1c2;
        line-height: 1.35;
    }

    .track-count {
        margin-top: 7px;
        color: #b7ff9c;
        font-size: 13px;
        font-weight: 800;
    }

    .open {
        color: var(--collection-accent);
        font-size: 13px;
        font-weight: 900;
        text-align: right;
    }

    @media (max-width: 620px) {
        .card {
            grid-template-columns: auto minmax(0, 1fr);
        }

        .open {
            grid-column: 2;
            text-align: left;
        }
    }
</style>

