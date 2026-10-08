<script lang="ts">
    import {goto} from '$app/navigation';
    import {favoritesStore} from '$lib/favorites/favorites';
    import {selectFavoriteEntries, type FavoritesPlaybackScope} from '$lib/favorites/playback';
    import {favoritesPlaybackUrl} from '$lib/favorites/launch';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';

    export let program: 'DG' | 'COL';
    export let language: 'en' | 'es' | 'ptbr' = 'en';
    export let options: {value: string; label: string}[] = [];
    let filter = '';

    const copy = {
        en: {play: 'Play Favorites', genre: 'Favorites genre', group: 'Favorites group', allGenres: 'All Genres', allCollections: 'All Collections', entries: 'favorite entries', empty: 'Star tracks in a program’s track list to save favorites.'},
        es: {play: 'Reproducir favoritos', genre: 'Género de favoritos', group: 'Grupo de favoritos', allGenres: 'Todos los géneros', allCollections: 'Todas las colecciones', entries: 'entradas favoritas', empty: 'Marca canciones con la estrella en la lista de un programa para guardar favoritos.'},
        ptbr: {play: 'Ouvir favoritos', genre: 'Gênero dos favoritos', group: 'Grupo dos favoritos', allGenres: 'Todos os gêneros', allCollections: 'Todas as coleções', entries: 'itens favoritos', empty: 'Marque músicas com a estrela na lista de um programa para salvar favoritos.'}
    };
    $: scope = program === 'DG'
        ? {program: 'DG', genre: filter || undefined} as FavoritesPlaybackScope
        : {program: 'COL', collectionGroup: filter || undefined} as FavoritesPlaybackScope;
    $: count = selectFavoriteEntries($favoritesStore, scope).length;
</script>

<div class="favorites-playback">
    <label>
        <span>{program === 'DG' ? copy[language].genre : copy[language].group}</span>
        <select bind:value={filter}>
            <option value="">{program === 'DG' ? copy[language].allGenres : copy[language].allCollections}</option>
            {#each options as option}<option value={option.value}>{option.label}</option>{/each}
        </select>
    </label>
    <button type="button" disabled={count === 0}
        on:click={() => goto(favoritesPlaybackUrl(scope, language, $playbackSettingsStore))}>
        ★ {copy[language].play}
    </button>
    <span class="favorite-count" aria-live="polite">{count} {copy[language].entries}</span>
    {#if count === 0}<p>{copy[language].empty}</p>{/if}
</div>

<style>
    .favorites-playback {display: flex; flex-wrap: wrap; align-items: end; gap: 12px; padding: 14px; margin-bottom: 16px; border: 1px solid #cfb87c; border-radius: 10px;}
    label {display: flex; flex-direction: column; gap: 6px; flex: 1 1 220px;}
    select, button {min-height: 44px; padding: 8px 12px; border-radius: 7px; font: inherit;}
    select {color: #eee; background: #202020; border: 1px solid #777; width: 100%;}
    button {color: #161616; background: #cfb87c; border: 0; font-weight: 700; cursor: pointer;}
    button:disabled {opacity: .5; cursor: default;}
    .favorite-count {align-self: center;}
    p {flex-basis: 100%; margin: 0; font-size: .9rem;}
</style>
