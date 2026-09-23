<script context="module" lang="ts">
    // Types live ONLY in module script → no runtime, no conflicts
    export type BrowseMode = 'decade_genre' | 'collection' | 'artist_spotlight';
    export type PlaybackOrder = 'up' | 'down' | 'shuffle';
    export type VoicePlayMode = 'before' | 'over';
    export type PauseMode = 'pause' | 'continuous';
    export type CategoryMode = 'single' | 'multiple';
    import {PROGRAM_TYPES} from '$lib/types/program';
</script>

<script lang="ts">
    import type {PlaybackProgramType} from '$lib/types/program';
    import type {Language} from '$lib/stores/selection';
    import {classicViewCopy} from '$lib/carmode/classicViewLabels';
    import NarrationOptions from './NarrationOptions.svelte';

    // Props (runtime)
    export let decade: string | undefined;
    export let genre: string | undefined;
    export let collection: string | undefined; // ✅ ADD THIS
    export let mode: import('./CarModeHeader.svelte').BrowseMode = 'decade_genre';
    export let programType: PlaybackProgramType | undefined;
    export let language: Language = 'en';


    export let compact: boolean = false;
    export let detailLength: 'off' | 'short' | 'long' = 'short';
    export let artistBioLength: 'short' | 'long' = 'short';
    export let artistStoriesEnabled = false;
    export let narrationOptionsLocked = false;
    export let onDetailLengthChange: (value: 'off' | 'short' | 'long') => void;
    export let onArtistStoriesChange: (value: boolean) => void;
    export let onArtistBioLengthChange: (value: 'short' | 'long') => void = () => {};

    const modeLabel = (
        m: import('./CarModeHeader.svelte').BrowseMode,
        p: PlaybackProgramType | undefined
    ) =>
        m === 'artist_spotlight'
            ? 'Artist Spotlight'
            : p === 'RADIO_ARTIST'
                ? 'Artist Spotlight Radio'
                : m === 'collection'
                    ? 'Collection'
                    : 'Decade–Genre';

    const categoryLabel = (m: import('./CarModeHeader.svelte').CategoryMode) =>
        m === 'multiple' ? 'Multiple' : 'Single';

    const orderLabel = (o: import('./CarModeHeader.svelte').PlaybackOrder) =>
        o === 'down' ? 'Down' : o === 'shuffle' ? 'Shuffle' : 'Up';

    const voicePlayLabel = (v: import('./CarModeHeader.svelte').VoicePlayMode) =>
        v === 'over' ? 'Over Track' : 'Before Track';

    const pauseLabel = (p: import('./CarModeHeader.svelte').PauseMode) =>
        p === 'continuous' ? 'Continuous' : 'Pause Between Tracks';

    const voiceText = (vs: string[]) => (vs.length ? vs.join(', ') : 'None');

    const languageText = (langs: string[]) =>
        langs.map(l => l.toUpperCase()).join(' • ');
</script>

<div class="cm-panel" class:compact>
    <div class="cm-main">
        <div class="cm-row cm-row--title">
            <span class="cm-tag">🚗 {classicViewCopy[language].carMode}</span>

            {#if mode === 'decade_genre'}
                <span class="cm-main-text">
                    {#if programType === PROGRAM_TYPES.FAVORITES_DG}
                        {#if (decade ?? '').toUpperCase() === 'ALL'}
                            {#if genre}
                                ⭐ All Decades {genre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Favorites
                            {:else}
                                ⭐ All Decades Favorites (All Genres)
                            {/if}
                        {:else if genre}
                            ⭐ {decade ?? '—'} {genre.replace(/_/g, ' ')} Favorites
                        {:else}
                            ⭐ {decade ?? '—'} Favorites (All Genres)
                        {/if}
                    {:else if programType === 'RADIO_DG'}
                        TopSpot Radio • {genre ? genre.replace(/_/g, ' ') : 'All Genres'}
                    {:else}
                        {decade ?? '—'} • {genre ? genre.replace(/_/g, ' ') : '—'}
                    {/if}
                </span>
            {:else if mode === 'artist_spotlight'}
    <span class="cm-main-text">
        {programType === 'RADIO_ARTIST' ? 'Artist Radio' : 'Artist Spotlight'}
    </span>
            {:else}
    <span class="cm-main-text">
        {collection ?? '—'}
    </span>
            {/if}

        </div>

        {#if programType === 'RADIO_ARTIST'}
            <div class="cm-radio-options"><span>Details:</span>{#each ['off', 'short', 'long'] as value}<button class:selected={detailLength === value} on:click={() => onDetailLengthChange(value as 'off' | 'short' | 'long')}>{value === 'off' ? 'Off' : value === 'short' ? 'Short' : 'Long'}</button>{/each}<span>Artist bios:</span>{#each ['short', 'long'] as value}<button class:selected={artistBioLength === value} on:click={() => onArtistBioLengthChange(value as 'short' | 'long')}>{value === 'short' ? 'Short' : 'Long'}</button>{/each}</div>
        {:else}
            <NarrationOptions {language} {detailLength} {artistStoriesEnabled} {narrationOptionsLocked} {onDetailLengthChange} {onArtistStoriesChange}/>
        {/if}

    </div>
</div>

<style>
    .cm-panel {
        background: rgba(0, 0, 0, 0.45);
        padding: 0.55rem 0.9rem;
        border-radius: 10px;
        margin-bottom: 0.8rem;
        color: #fff;
        font-size: 0.85rem;
        line-height: 1.4;
    }

    .cm-panel.compact {
        margin-bottom: 0.25rem;
        padding: 0.28rem 0.7rem;
    }

    .cm-main {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        align-items: center; /* ⬅ center all rows horizontally */
    }

    .cm-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
    }

    .cm-row--title {
        justify-content: flex-start;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 600;
    }

    .cm-tag {
        background: #1db954;
        color: #000;
        border-radius: 999px;
        padding: 0.1rem 0.6rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .cm-main-text {
        opacity: 0.9;
    }
    .cm-radio-options{display:flex;gap:.35rem;align-items:center;flex-wrap:wrap}.cm-radio-options button{border:1px solid #f7dc82;border-radius:999px;color:#f7dc82;background:#282115;padding:.2rem .5rem}.cm-radio-options button.selected{color:#211706;background:#f7dc82}

</style>
