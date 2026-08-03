<script lang="ts">
    import type {JourneyCollectionGroup} from '$lib/collections/types';
    import {localizedCollectionCopy} from '$lib/config/collectionsJourney';
    import type {Language} from '$lib/types/playback';

    export let group: JourneyCollectionGroup;
    export let language: Language = 'en';
    export let exploreLabel: string;

    $: previewItems = group.items.slice(0, 7);
    $: remainingItems = Math.max(0, group.items.length - previewItems.length);
    $: exploreHref = `/journey-prototype/collections/${encodeURIComponent(group.slug)}`;
</script>

<article class="preview" style={`--group-accent: ${group.presentation.accent}`}>
    <div class="heading">
        <span class="icon" aria-hidden="true">{group.presentation.icon}</span>
        <div>
            <p class="eyebrow">Selected collection group</p>
            <h2>{group.name}</h2>
        </div>
    </div>

    <p class="description">
        {localizedCollectionCopy(group.presentation.description, language)}
    </p>

    <p class="count">
        {group.items.length} {group.items.length === 1 ? 'collection' : 'collections'}
        {#if group.totalTracks > 0}
            <span aria-hidden="true"> • </span>{group.totalTracks} tracks
        {/if}
    </p>

    {#if group.items.length > 0}
        <ul class="names" aria-label={`${group.name} collection preview`}>
            {#each previewItems as collection (collection.slug)}
                <li>{collection.name}</li>
            {/each}
            {#if remainingItems > 0}
                <li class="more">+{remainingItems} more</li>
            {/if}
        </ul>

        <a class="explore" href={exploreHref}>
            {exploreLabel} {group.name}
            <span aria-hidden="true">→</span>
        </a>
    {:else}
        <p class="empty">No collections are currently available in this group.</p>
    {/if}
</article>

<style>
    .preview {
        min-height: 100%;
        padding: clamp(20px, 3vw, 32px);
        color: #fff;
        background: linear-gradient(145deg, rgba(35, 31, 23, 0.96), rgba(10, 10, 10, 0.96));
        border: 2px solid var(--group-accent);
        border-radius: 20px;
        box-shadow: 0 0 30px color-mix(in srgb, var(--group-accent) 22%, transparent);
    }

    .heading {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .icon {
        display: grid;
        width: 54px;
        height: 54px;
        place-items: center;
        flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 15px;
        font-size: 28px;
    }

    .eyebrow {
        margin: 0 0 4px;
        color: var(--group-accent);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    h2 {
        margin: 0;
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: clamp(26px, 3vw, 40px);
    }

    .description {
        margin: 20px 0 12px;
        color: #f4eedc;
        font-size: 17px;
        line-height: 1.55;
    }

    .count {
        color: #d6c17a;
        font-weight: 800;
    }

    .names {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 20px;
        margin: 20px 0;
        padding: 0;
        list-style: none;
    }

    .names li::before {
        content: '♪';
        margin-right: 8px;
        color: var(--group-accent);
    }

    .names .more {
        color: #c8c1b3;
        font-style: italic;
    }

    .explore {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        color: #101010;
        background: var(--group-accent);
        border-radius: 999px;
        text-decoration: none;
        font-weight: 900;
    }

    .explore:hover,
    .explore:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 3px;
    }

    .empty {
        color: #d8d1c2;
    }

    @media (min-width: 801px) and (min-height: 800px) {
        .preview {
            padding: 22px 26px;
        }

        .icon {
            width: 48px;
            height: 48px;
            font-size: 25px;
        }

        h2 {
            font-size: clamp(25px, 2.4vw, 34px);
        }

        .description {
            margin: 14px 0 8px;
            font-size: 16px;
        }

        .count {
            margin: 10px 0;
        }

        .names {
            gap: 6px 18px;
            margin: 14px 0;
        }

        .explore {
            padding: 11px 18px;
        }
    }
    @media (max-width: 600px) {
        .names {
            grid-template-columns: 1fr;
        }

        .explore {
            width: 100%;
            justify-content: center;
            text-align: center;
        }
    }
</style>

