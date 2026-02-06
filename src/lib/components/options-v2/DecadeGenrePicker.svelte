<script lang="ts">
    import ListPicker from '$lib/components/options/ListPicker.svelte';
    import type {DecadeOption, GenreOption} from '$lib/helpers/useCatalogLoader';

    export let decades: string[] = [];
    export let genres: string[] = [];
    export let decadeOptions: DecadeOption[] = [];
    export let genreOptions: GenreOption[] = [];
    export let mode: 'single' | 'multiple' = 'single';
    export let active = false;

    export let onActivate: (group: 'decade' | 'genre') => void;
    export let onChange: (
        group: 'decade' | 'genre',
        selected: string[]
    ) => void;
</script>

<section class="picker-group" data-active={active}>
    <div class="picker-group__body">
        <ListPicker
                title="Decades"
                group="decade"
                bind:selected={decades}
                {mode}
                activeGroup={active ? 'decade' : null}
                options={decadeOptions}
                on:activate={() => onActivate('decade')}
                on:change={(e) => onChange('decade', e.detail.selected)}
        />


        <ListPicker
                title="Genres"
                group="genre"
                bind:selected={genres}
                {mode}
                activeGroup={active ? 'genre' : null}
                options={genreOptions}
                on:activate={() => onActivate('genre')}
                on:change={(e) => onChange('genre', e.detail.selected)}
        />

    </div>
</section>

<style>
    .picker-group__body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
</style>
