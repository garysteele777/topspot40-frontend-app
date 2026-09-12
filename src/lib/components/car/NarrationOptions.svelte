<script lang="ts">
    import {tick} from 'svelte';
    import type {Language} from '$lib/stores/selection';

    export let language: Language = 'en';
    export let detailLength: 'off' | 'short' | 'long' = 'short';
    export let artistStoriesEnabled = false;
    export let onDetailLengthChange: (value: 'off' | 'short' | 'long') => void;
    export let onArtistStoriesChange: (value: boolean) => void;

    const copy: Record<Language, Record<string, string>> = {
        en: { detailsLabel: 'Details', biosLabel: 'Artist bios', offDetails: 'Off', shortDetails: 'Short', longDetails: 'Long', storiesOff: 'Off', storiesOn: 'On', title: 'Narration options', details: 'Track details', detailsHelp: 'Choose how much you hear about each song.', short: 'Short', long: 'Long', stories: 'Artist bios', storiesHelp: 'Hear each available artist bio once during this program.', off: 'Off', on: 'On', close: 'Close' },
        es: { detailsLabel: 'Detalles', biosLabel: 'Biografías de artistas', offDetails: 'Desactivados', shortDetails: 'Breves', longDetails: 'Largos', storiesOff: 'Desactivadas', storiesOn: 'Activadas', title: 'Opciones de narración', details: 'Detalles de la canción', detailsHelp: 'Elige cuánto quieres escuchar sobre cada canción.', short: 'Breves', long: 'Largos', stories: 'Biografías de artistas', storiesHelp: 'Escucha una vez durante este programa cada biografía de artista disponible.', off: 'Desactivado', on: 'Activado', close: 'Cerrar' },
        ptbr: { detailsLabel: 'Detalhes', biosLabel: 'Biografias dos artistas', offDetails: 'Desativados', shortDetails: 'Curtos', longDetails: 'Longos', storiesOff: 'Desativadas', storiesOn: 'Ativadas', title: 'Opções de narração', details: 'Detalhes da música', detailsHelp: 'Escolha quanto deseja ouvir sobre cada música.', short: 'Curtos', long: 'Longos', stories: 'Biografias dos artistas', storiesHelp: 'Ouça uma vez durante este programa cada biografia de artista disponível.', off: 'Desativado', on: 'Ativado', close: 'Fechar' }
    };
    let open = false;
    let trigger: HTMLButtonElement;
    let panel: HTMLDivElement;
    $: text = copy[language];
    $: detailValue = detailLength === 'off' ? text.offDetails : detailLength === 'short' ? text.shortDetails : text.longDetails;
    $: biosValue = artistStoriesEnabled ? text.storiesOn : text.storiesOff;
    $: summary = `${text.detailsLabel}: ${detailValue} • ${text.biosLabel}: ${biosValue}`;

    async function show(): Promise<void> { open = true; await tick(); panel?.focus(); }
    function close(): void { open = false; tick().then(() => trigger?.focus()); }
    function handleKeydown(event: KeyboardEvent): void { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); } }
</script>

<div class="narration-options">
    <button bind:this={trigger} type="button" class="summary" aria-expanded={open} aria-controls="narration-options-panel" aria-haspopup="dialog" aria-label={`${text.title}: ${summary}`} on:click={show}>
        <span aria-hidden="true">⚙</span>
        <span class="summary-content" aria-hidden="true">
            <span class="summary-pair"><span class="summary-label">{text.detailsLabel}:</span><span class="summary-value">{detailValue}</span></span>
            <span class="summary-separator">•</span>
            <span class="summary-pair"><span class="summary-label">{text.biosLabel}:</span><span class="summary-value">{biosValue}</span></span>
        </span>
    </button>
</div>

{#if open}
    <div class="backdrop" aria-hidden="true" on:click={close}></div>
    <div bind:this={panel} id="narration-options-panel" class="panel" role="dialog" aria-modal="true" aria-labelledby="narration-options-title" tabindex="-1" on:click|stopPropagation on:keydown={handleKeydown}>
        <h2 id="narration-options-title">{text.title}</h2>
        <section aria-labelledby="detail-options-title">
            <h3 id="detail-options-title">{text.details}</h3><p>{text.detailsHelp}</p>
            <div class="choices" role="group" aria-label={text.details}>
                <button type="button" class:selected={detailLength === 'off'} aria-pressed={detailLength === 'off'} on:click={() => onDetailLengthChange('off')}>{text.offDetails}</button>
                <button type="button" class:selected={detailLength === 'short'} aria-pressed={detailLength === 'short'} on:click={() => onDetailLengthChange('short')}>{text.short}</button>
                <button type="button" class:selected={detailLength === 'long'} aria-pressed={detailLength === 'long'} on:click={() => onDetailLengthChange('long')}>{text.long}</button>
            </div>
        </section>
        <section aria-labelledby="stories-options-title">
            <h3 id="stories-options-title">{text.stories}</h3><p>{text.storiesHelp}</p>
            <div class="choices" role="group" aria-label={text.stories}>
                <button type="button" class:selected={!artistStoriesEnabled} aria-pressed={!artistStoriesEnabled} on:click={() => onArtistStoriesChange(false)}>{text.off}</button>
                <button type="button" class:selected={artistStoriesEnabled} aria-pressed={artistStoriesEnabled} on:click={() => onArtistStoriesChange(true)}>{text.on}</button>
            </div>
        </section>
        <button type="button" class="close" on:click={close}>{text.close}</button>
    </div>
{/if}

<style>
    .narration-options { display:flex; justify-content:center; margin-top:.35rem; }
    .summary { min-height:44px; padding:7px 12px; border:1px solid rgba(207,184,124,.52); border-radius:999px; background:#22272d; box-shadow:0 2px 7px rgba(0,0,0,.34); color:#ddd; cursor:pointer; font:inherit; font-size:.8rem; font-weight:700; transition:background 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 100ms ease; }
    .summary:hover { border-color:#cfb87c; background:#2c333b; }
    .summary:active { box-shadow:0 1px 3px rgba(0,0,0,.4); transform:translateY(1px); }
    .summary-content { display:inline-flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0 .4rem; }
    .summary-pair { display:inline-flex; align-items:baseline; gap:.25em; white-space:nowrap; }
    .summary-label { color:#f1f1f1; }
    .summary-value { color:#f4d58a; font-weight:800; }
    .summary:focus-visible, .panel button:focus-visible { outline:3px solid #fff; outline-offset:3px; }
    .backdrop { position:fixed; inset:0; z-index:1100; background:rgba(0,0,0,.5); }
    .panel { position:fixed; z-index:1101; top:50%; left:50%; width:min(390px,calc(100vw - 32px)); max-height:min(560px,calc(100dvh - 32px)); overflow:auto; transform:translate(-50%,-50%); padding:20px; border:1px solid #676767; border-radius:14px; background:#181818; color:#fff; box-shadow:0 18px 48px rgba(0,0,0,.6); }
    h2 { margin:0 0 16px; font-size:1.3rem; } h3 { margin:0; font-size:1rem; } p { margin:5px 0 10px; color:#c7c7c7; font-size:.9rem; line-height:1.35; } section + section { margin-top:20px; }
    .choices { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; } .choices button, .close { min-height:44px; border:1px solid #666; border-radius:9px; background:#303030; color:#fff; cursor:pointer; font:inherit; font-weight:800; overflow-wrap:anywhere; } .choices button.selected { border-color:#1db954; background:#1db954; color:#111; } .close { width:100%; margin-top:20px; }
    @media (max-width:480px) { .panel { top:auto; bottom:0; width:100%; max-height:min(78dvh,620px); transform:translateX(-50%); border-radius:16px 16px 0 0; } .summary { max-width:calc(100vw - 24px); white-space:normal; } }
</style>
