<script lang="ts">
    import {ARTIST_CATEGORY_PRESENTATION} from '$lib/config/artistSpotlightsJourney';
    import {ARTIST_ALPHABET_RANGES} from '$lib/artistSpotlights/types';
    import type {
        ArtistAlphabetRange,
        ArtistGenreOption,
        ArtistSpotlightCategory
    } from '$lib/artistSpotlights/types';

    export let category: ArtistSpotlightCategory;
    export let range: ArtistAlphabetRange;
    export let genre: string;
    export let genres: ArtistGenreOption[] = [];
    export let onCategoryChange: (category: ArtistSpotlightCategory) => void;
    export let onRangeChange: (range: ArtistAlphabetRange) => void;
    export let onGenreChange: (genre: string) => void;

    const categories: ArtistSpotlightCategory[] = ['featured', 'other', 'single'];
</script>

<div class="filters">
    <section aria-labelledby="artist-type-heading">
        <h2 id="artist-type-heading">Artist Programs</h2>
        <div class="category-grid">
            {#each categories as option}
                <button
                    type="button"
                    class:active={category === option}
                    aria-pressed={category === option}
                    on:click={() => onCategoryChange(option)}
                >
                    <span class="category-icon" aria-hidden="true">{ARTIST_CATEGORY_PRESENTATION[option].icon}</span>
                    <span>
                        <strong>{ARTIST_CATEGORY_PRESENTATION[option].label}</strong>
                        <small>{ARTIST_CATEGORY_PRESENTATION[option].description}</small>
                    </span>
                </button>
            {/each}
        </div>
    </section>

    <div class="filter-row">
        <section aria-labelledby="alphabet-heading">
            <h2 id="alphabet-heading">Alphabetical Groups</h2>
            <div class="pill-grid alphabet-grid">
                {#each ARTIST_ALPHABET_RANGES as option}
                    <button type="button" class:active={range === option} aria-pressed={range === option} on:click={() => onRangeChange(option)}>
                        {option}
                    </button>
                {/each}
            </div>
        </section>

        <section aria-labelledby="genre-heading">
            <h2 id="genre-heading">Genre</h2>
            <div class="pill-grid genre-grid">
                <button type="button" class:active={genre === 'all'} aria-pressed={genre === 'all'} on:click={() => onGenreChange('all')}>
                    All Genres
                </button>
                {#each genres as option (option.id)}
                    <button type="button" class:active={genre === option.id} aria-pressed={genre === option.id} on:click={() => onGenreChange(option.id)}>
                        {option.label}
                    </button>
                {/each}
            </div>
        </section>
    </div>
</div>

<style>
    .filters { display: grid; gap: 22px; padding-bottom: 22px; border-bottom: 1px solid rgba(240, 186, 99, 0.3); }
    h2 { margin: 0 0 10px; color: #f7dc82; font-family: Georgia, serif; font-size: 18px; }
    button { cursor: pointer; color: #f7f1df; }
    .category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .category-grid button { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 11px; align-items: center; min-height: 82px; padding: 13px; text-align: left; background: rgba(40, 36, 29, 0.9); border: 1px solid rgba(214, 193, 122, 0.32); border-radius: 14px; }
    .category-grid button:hover, .category-grid button:focus-visible, button.active { border-color: #f0ba63; background: rgba(76, 57, 29, 0.96); outline: none; box-shadow: 0 0 18px rgba(240, 186, 99, 0.16); }
    .category-icon { display: grid; width: 38px; height: 38px; place-items: center; color: #1a1208; background: #f0ba63; border-radius: 50%; font-weight: 900; }
    .category-grid strong, .category-grid small { display: block; }
    .category-grid strong { color: #fff0bb; }
    .category-grid small { margin-top: 4px; color: #cfc6b2; line-height: 1.3; }
    .filter-row { display: grid; grid-template-columns: minmax(300px, 0.8fr) minmax(0, 1.4fr); gap: 18px; }
    .pill-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill-grid.alphabet-grid { display: grid; grid-template-columns: repeat(3, minmax(70px, 1fr)); gap: 6px; }
    .pill-grid.alphabet-grid button { width: 100%; min-height: 42px; padding-block: 7px; white-space: nowrap; }
    .pill-grid button { min-height: 40px; padding: 8px 13px; background: rgba(34, 34, 34, 0.95); border: 1px solid #4b473d; border-radius: 999px; font-weight: 750; }
    .pill-grid button:hover, .pill-grid button:focus-visible { border-color: #f0ba63; background: rgba(76, 57, 29, 0.96); outline: none; }
    .pill-grid button.active, .pill-grid button.active:hover, .pill-grid button.active:focus-visible { color: #1a1208; background: linear-gradient(180deg, #f8d98d, #e9ad48); border-color: #ffe9b5; box-shadow: 0 0 0 2px rgba(240, 186, 99, 0.2), 0 0 18px rgba(240, 186, 99, 0.38); }

    @media (max-width: 820px) {
        .category-grid { grid-template-columns: 1fr; }
        .category-grid button { min-height: 70px; }
    }

    @media (max-width: 620px) {
        .filter-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 520px) {
        .category-grid small { display: none; }
    }

    @media (max-width: 360px) {
        .pill-grid.alphabet-grid { grid-template-columns: repeat(2, minmax(70px, 1fr)); }
    }

    @media (max-width: 230px) {
        .pill-grid.alphabet-grid { grid-template-columns: 1fr; }
    }
</style>
