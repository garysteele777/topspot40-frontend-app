<script lang="ts">
    import {onMount} from 'svelte';
    import {NOSTALGIA_RADIO_GENRES, NOSTALGIA_RADIO_GENRE_LABELS, normalizeNostalgiaRadioGenres, type NostalgiaRadioGenreSlug} from '$lib/journey/nostalgiaRadioGenres';
    import type {Language} from '$lib/types/playback';

    const STORAGE_KEY = 'topspot_nostalgia_radio_genres';
    export let selectedGenres: NostalgiaRadioGenreSlug[] = [...NOSTALGIA_RADIO_GENRES];
    export let onContinue: (genres: NostalgiaRadioGenreSlug[]) => void;
    export let language: Language | 'pt-BR' = 'en';

    const copy = {
        en: {artAlt: 'Eight musical roads leading to TopSpot40 genres', toggle: 'Toggle', title: 'Nostalgia Radio', instruction: 'Select all the genres you want to include in Nostalgia Radio.', selectAll: 'Select All Genres', clearAll: 'Clear All Genres', selected: 'genres selected', genre: 'Genre', genres: 'Genres', continue: 'Continue with'},
        es: {artAlt: 'Ocho caminos musicales que conducen a los géneros de TopSpot40', toggle: 'Alternar', title: 'Radio Nostalgia', instruction: 'Selecciona todos los géneros que deseas incluir en Radio Nostalgia.', selectAll: 'Seleccionar todos los géneros', clearAll: 'Borrar todos los géneros', selected: 'géneros seleccionados', genre: 'género', genres: 'géneros', continue: 'Continuar con'},
        ptbr: {artAlt: 'Oito caminhos musicais que levam aos gêneros do TopSpot40', toggle: 'Alternar', title: 'Rádio Nostalgia', instruction: 'Selecione todos os gêneros que deseja incluir no Rádio Nostalgia.', selectAll: 'Selecionar todos os gêneros', clearAll: 'Limpar todos os gêneros', selected: 'gêneros selecionados', genre: 'gênero', genres: 'gêneros', continue: 'Continuar com'}
    };
    $: text = copy[language === 'pt-BR' ? 'ptbr' : language];

    $: selectedCount = selectedGenres.length;
    $: continueLabel = `${text.continue} ${selectedCount} ${selectedCount === 1 ? text.genre : text.genres}`;

    function setSelectedGenres(genres: readonly string[]): void {
        selectedGenres = normalizeNostalgiaRadioGenres(genres);
        try { localStorage.setItem(STORAGE_KEY, selectedGenres.join(',')); } catch { /* optional persistence */ }
    }
    function toggleGenre(genre: NostalgiaRadioGenreSlug): void {
        setSelectedGenres(selectedGenres.includes(genre) ? selectedGenres.filter(value => value !== genre) : [...selectedGenres, genre]);
    }
    function selectAllGenres(): void { setSelectedGenres(NOSTALGIA_RADIO_GENRES); }
    function clearAllGenres(): void { setSelectedGenres([]); }
    function continueToRadio(): void { if (selectedCount > 0) onContinue(selectedGenres); }
    onMount(() => {
        try { const saved = localStorage.getItem(STORAGE_KEY); if (saved !== null) setSelectedGenres(saved.split(',')); } catch { /* retain default */ }
    });
</script>

<main class="genre-page">
    <div class="art-layer"><img class="journey-art" src="/images/journey/08-ai-genre-road.png" alt={text.artAlt} /><div class="shade" aria-hidden="true"></div></div>
    <div class="hotspot-layer">
        {#each NOSTALGIA_RADIO_GENRES as genre}
            <button type="button" class="genre-button genre-{genre}" class:selected={selectedGenres.includes(genre)} aria-label={`${text.toggle} ${NOSTALGIA_RADIO_GENRE_LABELS[genre]}`} aria-pressed={selectedGenres.includes(genre)} on:click={() => toggleGenre(genre)}>
                <span class="checkmark" aria-hidden="true">✓</span><span class="screen-reader-only">{NOSTALGIA_RADIO_GENRE_LABELS[genre]}</span>
            </button>
        {/each}
    </div>
    <section class="radio-card" aria-labelledby="nostalgia-radio-heading">
        <h1 id="nostalgia-radio-heading">{text.title}</h1>
        <p>{text.instruction}</p>
        <div class="actions"><button type="button" on:click={selectAllGenres}>{text.selectAll}</button><button type="button" on:click={clearAllGenres}>{text.clearAll}</button></div>
        <p class="count" aria-live="polite">{selectedCount} / {NOSTALGIA_RADIO_GENRES.length} {text.selected}</p>
        <button class="continue" type="button" disabled={selectedCount === 0} on:click={continueToRadio}>{continueLabel} <span aria-hidden="true">→</span></button>
    </section>
</main>

<style>
    .genre-page { position: relative; min-height: calc(100vh - 72px); overflow: hidden; background: #0b0a07; }.art-layer,.hotspot-layer { position:absolute; top:50%; left:50%; width:max(100%,calc((100vh - 72px)*1.780618)); aspect-ratio:1672/939; transform:translate(-50%,-50%); }.art-layer{z-index:1}.hotspot-layer{z-index:5;pointer-events:none}.journey-art{display:block;width:100%;height:100%;object-fit:fill}.shade{position:absolute;inset:0;background:rgba(0,0,0,.18)}
    .genre-button{position:absolute;width:16.5%;height:14.8%;padding:0;border:3px solid transparent;border-radius:6px;background:transparent;pointer-events:auto;cursor:pointer}.genre-button:focus-visible{outline:3px solid #fff0b0;outline-offset:3px}.genre-button.selected{border-color:#f7dc82;background:rgba(201,164,59,.18);box-shadow:0 0 15px #f7dc82,inset 0 0 26px rgba(247,220,130,.32)}.checkmark{position:absolute;top:8px;right:9px;display:none;width:31px;height:31px;color:#241b08;background:#f7dc82;border:2px solid #fff0b0;border-radius:50%;font-size:23px;font-weight:900;line-height:26px}.selected .checkmark{display:block}
    .genre-country,.genre-pop,.genre-rock,.genre-rnb_soul{left:4.85%}.genre-latin_global,.genre-blues_jazz,.genre-folk_acoustic,.genre-tv_themes{left:79.35%}.genre-country,.genre-latin_global{top:14.9%}.genre-pop,.genre-blues_jazz{top:34.25%}.genre-rock,.genre-folk_acoustic{top:54.7%}.genre-rnb_soul,.genre-tv_themes{top:74.85%}
    .radio-card{position:absolute;z-index:7;top:50%;left:50%;width:min(440px,42vw);padding:24px;transform:translate(-50%,-50%);color:#fff;background:rgba(12,10,6,.89);border:2px solid #cfb87c;border-radius:22px;box-shadow:0 10px 45px rgba(0,0,0,.65);text-align:center}h1{margin:0;color:#f7dc82;font-family:Georgia,serif;font-size:clamp(31px,3vw,47px)}.radio-card p{line-height:1.4}.actions{display:flex;justify-content:center;flex-wrap:wrap;gap:9px}.actions button,.continue{padding:11px 15px;border:1px solid #f7dc82;border-radius:999px;color:#f7dc82;background:#282115;font-weight:800;cursor:pointer}.count{color:#fff0b0;font-weight:700}.continue{width:100%;color:#211706;background:#f7dc82;border-color:#fff0b0;font-size:17px}.continue:disabled{cursor:not-allowed;opacity:.45}.screen-reader-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    @media (max-width:1199px),(max-height:649px){.genre-page{min-height:100vh;padding:20px 14px 32px;background:linear-gradient(#17140d,#080806)}.art-layer{opacity:.22}.hotspot-layer{position:relative;top:auto;left:auto;width:min(600px,100%);margin:170px auto 0;transform:none;display:grid;grid-template-columns:repeat(2,1fr);gap:10px;aspect-ratio:auto}.genre-button{position:relative;left:auto!important;top:auto!important;width:auto;height:70px;background:rgba(20,18,13,.9);border-color:#695a31}.genre-button::after{content:attr(aria-label);color:#f7dc82;font-size:14px}.radio-card{position:relative;top:auto;left:auto;width:min(600px,100%);margin:20px auto 0;transform:none}.checkmark{top:4px;right:4px}}
</style>
