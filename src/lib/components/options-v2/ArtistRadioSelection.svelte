<script lang="ts">
    import {onMount} from 'svelte';
    import {ARTIST_RADIO_GENRES, ARTIST_RADIO_GENRE_LABELS, normalizeArtistRadioGenres, type ArtistRadioGenreSlug} from '$lib/journey/artistRadioGenres';
    import type {Language} from '$lib/types/playback';

    const STORAGE_KEY = 'topspot_artist_radio_genres';
    export let onContinue: (genres: ArtistRadioGenreSlug[]) => void;
    export let language: Language | 'pt-BR' = 'en';
    const copy = {
        en: {artAlt: 'Seven musical roads leading to Artist Radio genres', toggle: 'Toggle', title: 'Artist Radio', instruction: 'Select all the genres you want included in Artist Radio. TopSpot40 will choose the Featured Artists.', selectAll: 'Select All Genres', clearAll: 'Clear All Genres', selected: 'genres selected', explanation: 'TopSpot40 will choose Featured Artists from your selected genres and keep the music playing.', spotlight: 'Want to hear all available songs by one artist? Choose that artist in Artist Spotlight.', continue: 'Continue with', genre: 'Genre', genres: 'Genres'},
        es: {artAlt: 'Siete caminos musicales que conducen a los géneros de Radio de Artistas', toggle: 'Alternar', title: 'Radio de Artistas', instruction: 'Selecciona todos los géneros que deseas incluir en Radio de Artistas. TopSpot40 elegirá a los artistas destacados.', selectAll: 'Seleccionar todos los géneros', clearAll: 'Borrar todos los géneros', selected: 'géneros seleccionados', explanation: 'TopSpot40 elegirá artistas destacados de los géneros seleccionados y mantendrá la música sonando.', spotlight: '¿Quieres escuchar todas las canciones disponibles de un artista? Elige a ese artista en Artistas Destacados.', continue: 'Continuar con', genre: 'género', genres: 'géneros'},
        ptbr: {artAlt: 'Sete caminhos musicais que levam aos gêneros do Rádio de Artistas', toggle: 'Alternar', title: 'Rádio de Artistas', instruction: 'Selecione todos os gêneros que deseja incluir no Rádio de Artistas. O TopSpot40 escolherá os artistas em destaque.', selectAll: 'Selecionar todos os gêneros', clearAll: 'Limpar todos os gêneros', selected: 'gêneros selecionados', explanation: 'O TopSpot40 escolherá artistas em destaque dos gêneros selecionados e manterá a música tocando.', spotlight: 'Quer ouvir todas as músicas disponíveis de um artista? Escolha esse artista em Destaques de Artistas.', continue: 'Continuar com', genre: 'gênero', genres: 'gêneros'}
    };
    $: text = copy[language === 'pt-BR' ? 'ptbr' : language];
    let selectedGenres: ArtistRadioGenreSlug[] = [...ARTIST_RADIO_GENRES];
    $: count = selectedGenres.length;
    function setGenres(values: readonly string[]) { selectedGenres = normalizeArtistRadioGenres(values); try { localStorage.setItem(STORAGE_KEY, selectedGenres.join(',')); } catch {} }
    function toggle(genre: ArtistRadioGenreSlug) { setGenres(selectedGenres.includes(genre) ? selectedGenres.filter(value => value !== genre) : [...selectedGenres, genre]); }
    onMount(() => { try { const saved = localStorage.getItem(STORAGE_KEY); if (saved !== null) setGenres(saved.split(',')); } catch {} });
</script>

<main class="genre-page" aria-labelledby="artist-radio-heading">
    <div class="art-layer"><img class="journey-art" src="/images/journey/08-ai-genre-road.png" alt={text.artAlt} /><div class="shade" aria-hidden="true"></div></div>
    <div class="hotspot-layer">
        {#each ARTIST_RADIO_GENRES as genre}
            <button type="button" class="genre-button genre-{genre}" class:selected={selectedGenres.includes(genre)} aria-label={`${text.toggle} ${ARTIST_RADIO_GENRE_LABELS[genre]}`} aria-pressed={selectedGenres.includes(genre)} on:click={() => toggle(genre)}>
                <span class="checkmark" aria-hidden="true">✓</span><span class="screen-reader-only">{ARTIST_RADIO_GENRE_LABELS[genre]}</span>
            </button>
        {/each}
    </div>
    <section class="radio-card">
        <h1 id="artist-radio-heading">{text.title}</h1>
        <p>{text.instruction}</p>
        <div class="actions"><button type="button" on:click={() => setGenres(ARTIST_RADIO_GENRES)}>{text.selectAll}</button><button type="button" on:click={() => setGenres([])}>{text.clearAll}</button></div>
        <p class="count" aria-live="polite">{count} / {ARTIST_RADIO_GENRES.length} {text.selected}</p>
        <p>{text.explanation}</p><p>{text.spotlight}</p>
        <button class="continue" type="button" disabled={count === 0} on:click={() => onContinue(selectedGenres)}>{text.continue} {count} {count === 1 ? text.genre : text.genres} →</button>
    </section>
</main>

<style>
 .genre-page{position:relative;min-height:calc(100vh - 72px);overflow:hidden;background:#0b0a07}.art-layer,.hotspot-layer{position:absolute;top:50%;left:50%;width:max(100%,calc((100vh - 72px)*1.780618));aspect-ratio:1672/939;transform:translate(-50%,-50%)}.art-layer{z-index:1}.hotspot-layer{z-index:5;pointer-events:none}.journey-art{display:block;width:100%;height:100%;object-fit:fill}.shade{position:absolute;inset:0;background:rgba(0,0,0,.18)}.genre-button{position:absolute;width:16.5%;height:14.8%;padding:0;border:3px solid transparent;border-radius:6px;background:transparent;pointer-events:auto;cursor:pointer}.genre-button:focus-visible{outline:3px solid #fff0b0;outline-offset:3px}.genre-button.selected{border-color:#f7dc82;background:rgba(201,164,59,.18);box-shadow:0 0 15px #f7dc82,inset 0 0 26px rgba(247,220,130,.32)}.checkmark{position:absolute;top:8px;right:9px;display:none;width:31px;height:31px;color:#241b08;background:#f7dc82;border:2px solid #fff0b0;border-radius:50%;font-size:23px;font-weight:900;line-height:26px}.selected .checkmark{display:block}.genre-country,.genre-pop,.genre-rock,.genre-rnb_soul{left:4.85%}.genre-latin_global,.genre-blues_jazz,.genre-folk_acoustic{left:79.35%}.genre-country,.genre-latin_global{top:14.9%}.genre-pop,.genre-blues_jazz{top:34.25%}.genre-rock,.genre-folk_acoustic{top:54.7%}.genre-rnb_soul{top:74.85%}.radio-card{position:absolute;z-index:7;top:50%;left:50%;width:min(440px,42vw);padding:24px;transform:translate(-50%,-50%);color:#fff;background:rgba(12,10,6,.89);border:2px solid #cfb87c;border-radius:22px;box-shadow:0 10px 45px rgba(0,0,0,.65);text-align:center}.radio-card h1{margin:0;color:#f7dc82;font-family:Georgia,serif;font-size:clamp(31px,3vw,47px)}.actions{display:flex;justify-content:center;flex-wrap:wrap;gap:9px}.actions button,.continue{padding:11px 15px;border:1px solid #f7dc82;border-radius:999px;color:#f7dc82;background:#282115;font-weight:800;cursor:pointer}.count{color:#fff0b0;font-weight:700}.continue{width:100%;color:#211706;background:#f7dc82;border-color:#fff0b0;font-size:17px}.continue:disabled{cursor:not-allowed;opacity:.45}.screen-reader-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
</style>
