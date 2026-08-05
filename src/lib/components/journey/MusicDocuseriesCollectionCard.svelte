<script lang="ts">
    import {
        musicDocuseriesCollectionArtwork,
        musicDocuseriesCollectionDescription,
        musicDocuseriesCollectionPresentation
    } from '$lib/config/musicDocuseriesJourney';
    import type {MusicDocuseriesCollection} from '$lib/musicDocuseries/types';

    export let collection: MusicDocuseriesCollection;
    export let selected = false;
    export let onSelect: () => void;

    $: presentation = musicDocuseriesCollectionPresentation(collection.slug);
    $: description = musicDocuseriesCollectionDescription(collection);
    $: artwork = musicDocuseriesCollectionArtwork(collection.slug);
</script>

<button type="button" class:active={selected} aria-pressed={selected} on:click={onSelect}
        style={`--series-accent:${presentation.accent}`}>
<span class="icon" aria-hidden="true">
    <img src={artwork} alt=""/>
</span>
    <span class="copy"><strong>{collection.name}</strong><small>{description}</small></span>
</button>

<style>
    button {
        display: grid;
        grid-template-columns:34px minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        width: 100%;
        min-height: 58px;
        padding: 9px 11px;
        color: #fff;
        background: rgba(36, 36, 36, .94);
        border: 1px solid rgba(214, 193, 122, .32);
        border-radius: 11px;
        text-align: left;
        cursor: pointer;
        transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
    }

    button:hover:not(.active) {
        background: rgba(53, 49, 41, .98);
        border-color: color-mix(in srgb, var(--series-accent) 72%, transparent);
        box-shadow: inset 0 0 0 1px rgba(247, 220, 130, .1), 0 0 12px rgba(215, 166, 74, .1);
    }

    button:focus-visible {
        outline: 2px solid #fff0bb;
        outline-offset: 2px;
    }

    button.active {
        color: #151006;
        background: var(--series-accent);
        border-color: #f7dc82;
        box-shadow: 0 0 15px rgba(215, 166, 74, .2);
    }

    .icon {
        display: block;
        width: 32px;
        height: 32px;
        overflow: hidden;
        background: rgba(0, 0, 0, .18);
        border-radius: 50%;
    }

    .icon img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .copy {
        min-width: 0;
    }

    .copy strong, .copy small {
        display: block;
    }

    .copy strong {
        overflow: hidden;
        font-family: Georgia, serif;
        font-size: 15px;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .copy small {
        margin-top: 3px;
        overflow: hidden;
        color: inherit;
        font-size: 11px;
        line-height: 1.15;
        opacity: .8;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (max-width: 800px) {
        button {
            min-height: 62px;
        }
    }
</style>
