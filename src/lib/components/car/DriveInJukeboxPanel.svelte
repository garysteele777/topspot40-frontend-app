<script lang="ts">
    import {onDestroy, onMount, tick} from 'svelte';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {
        displayTrackListArtist,
        displayTrackListTitle
    } from '$lib/carmode/trackListDisplay.js';
    import {createTrackListCsv, downloadCsv} from '$lib/program/trackListCsv';
    import {
        favoritesStore,
        isFavorite,
        toggleFavorite,
        type ProgramType
    } from '$lib/favorites/favorites';
    import type {Language} from '$lib/stores/selection';
    import {getBackendUrl} from '$lib/config';

    type JukeboxCopy = {
        dialogLabel: string; heading: string; close: string; export: string; exportHint: string;
        page: (current: number, total: number) => string; playing: string; alreadyPlayed: string;
        favorite: (trackName: string) => string; previous: string; previousAria: string;
        next: string; nextAria: string; playRank: (rank: number) => string; selectTrack: string;
        selectTrackAria: (rank: number, trackName: string, artistName: string) => string; empty: string;
    };

    const jukeboxCopy: Record<Language, JukeboxCopy> = {
        en: {dialogLabel: 'TopSpot40 jukebox track selector', heading: 'Choose Track to Play', close: 'Close jukebox', export: 'Export CSV', exportHint: 'Save this track list as a CSV for playlist transfer tools that work with Spotify and other music services.', page: (current, total) => `Page ${current} of ${total}`, playing: 'Playing', alreadyPlayed: 'Already played', favorite: trackName => `Favorite ${trackName}`, previous: 'Previous', previousAria: 'Previous five tracks', next: 'Next', nextAria: 'Next five tracks', playRank: rank => `Play #${rank}`, selectTrack: 'Select a Track', selectTrackAria: (rank, trackName, artistName) => `Select track #${rank}: ${trackName} by ${artistName}`, empty: 'No tracks available.'},
        es: {dialogLabel: 'Selector de canciones de la jukebox TopSpot40', heading: 'Elige una canción para reproducir', close: 'Cerrar jukebox', export: 'Exportar CSV', exportHint: 'Guarda esta lista de canciones como CSV para herramientas de transferencia de playlists compatibles con Spotify y otros servicios de música.', page: (current, total) => `Página ${current} de ${total}`, playing: 'Reproduciendo', alreadyPlayed: 'Ya reproducida', favorite: trackName => `Agregar ${trackName} a favoritos`, previous: 'Anterior', previousAria: 'Cinco canciones anteriores', next: 'Siguiente', nextAria: 'Siguientes cinco canciones', playRank: rank => `Reproducir n.º ${rank}`, selectTrack: 'Selecciona una canción', selectTrackAria: (rank, trackName, artistName) => `Seleccionar canción n.º ${rank}: ${trackName} de ${artistName}`, empty: 'No hay canciones disponibles.'},
        ptbr: {dialogLabel: 'Seletor de faixas da jukebox TopSpot40', heading: 'Escolha uma faixa para tocar', close: 'Fechar jukebox', export: 'Exportar CSV', exportHint: 'Salve esta lista de faixas como CSV para ferramentas de transferência de playlists compatíveis com Spotify e outros serviços de música.', page: (current, total) => `Página ${current} de ${total}`, playing: 'Tocando', alreadyPlayed: 'Já reproduzida', favorite: trackName => `Adicionar ${trackName} aos favoritos`, previous: 'Anterior', previousAria: 'Cinco faixas anteriores', next: 'Próxima', nextAria: 'Próximas cinco faixas', playRank: rank => `Tocar nº ${rank}`, selectTrack: 'Selecione uma faixa', selectTrackAria: (rank, trackName, artistName) => `Selecionar faixa nº ${rank}: ${trackName} de ${artistName}`, empty: 'Não há faixas disponíveis.'}
    };

    const printLabels: Record<Language, string> = {
        en: 'Print List',
        es: 'Imprimir lista',
        ptbr: 'Imprimir lista'
    };

    const printHints: Record<Language, string> = {
        en: 'Print the complete program track list with catalog number, titles, and artists.',
        es: 'Imprime la lista completa de canciones del programa con número de catálogo, títulos y artistas.',
        ptbr: 'Imprima a lista completa de faixas do programa com número de catálogo, títulos e artistas.'
    };

    const requestCopy: Record<Language, {
        requests: (count: number) => string; add: (rank: number) => string;
        queued: string; moveUp: string; moveDown: string; remove: string;
        clear: string; confirmClear: (count: number) => string; empty: string;
        confirmation: (rank: number) => string;
    }> = {
        en: {requests: count => `Requests (${count})`, add: rank => `Add #${rank} to Requests`, queued: 'Queued', moveUp: 'Move Up', moveDown: 'Move Down', remove: 'Remove', clear: 'Clear Requests', confirmClear: count => `Remove ${count} requests`, empty: 'No requests yet.', confirmation: rank => `#${rank} queued`},
        es: {requests: count => `Solicitudes (${count})`, add: rank => `Agregar #${rank} a solicitudes`, queued: 'En cola', moveUp: 'Subir', moveDown: 'Bajar', remove: 'Quitar', clear: 'Borrar solicitudes', confirmClear: count => `Quitar ${count} solicitudes`, empty: 'No hay solicitudes.', confirmation: rank => `#${rank} en cola`},
        ptbr: {requests: count => `Pedidos (${count})`, add: rank => `Adicionar #${rank} aos pedidos`, queued: 'Na fila', moveUp: 'Mover para cima', moveDown: 'Mover para baixo', remove: 'Remover', clear: 'Limpar pedidos', confirmClear: count => `Remover ${count} pedidos`, empty: 'Nenhum pedido ainda.', confirmation: rank => `#${rank} na fila`}
    };

    export let tracks: CarModeTrack[] = [];
    export let currentTrack: CarModeTrack | null = null;
    export let onJumpToTrack: ((track: CarModeTrack) => void) | undefined = undefined;
    export let onClose: () => void = () => {
    };
    export let variant: 'modal' | 'embedded' = 'modal';
    export let eyebrow = 'TopSpot40 Drive-In';
    export let heading = '';
    export let programLabel = '';
    export let exportFileName = 'TopSpot40 Track List.csv';
    export let isPlayed: (rank: number) => boolean = () => false;
    export let programType: ProgramType | null = null;
    export let programGroup: string | null = null;
    export let language: Language = 'en';
    export let catalogLookupName = '';
    export let printCategory = '';
    export let printTitle = '';
    export let requests: CarModeTrack[] = [];
    export let onAddRequest: ((track: CarModeTrack) => void) | undefined = undefined;
    export let onMoveRequest: ((index: number, direction: -1 | 1) => void) | undefined = undefined;
    export let onRemoveRequest: ((index: number) => void) | undefined = undefined;
    export let onClearRequests: (() => void) | undefined = undefined;
    export let openRequests = false;
    export let onRequestsViewOpened: (() => void) | undefined = undefined;

    const PAGE_SIZE = 5;
    const PRINT_TRACKS_PER_PAGE = 23;

    let pageIndex = 0;
    let selectedTrack: CarModeTrack | null = currentTrack;
    let lastCurrentIdentity = '';
    let printCatalogNumber = '';
    let showRequests = false;
    let clearRequestsConfirmation = false;
    let requestConfirmation = '';
    let requestConfirmationTimer: ReturnType<typeof setTimeout> | undefined;

    $: embedded = variant === 'embedded';
    $: copy = jukeboxCopy[language];
    $: printLabel = printLabels[language];
    $: printHint = printHints[language];
    $: requestsText = requestCopy[language];
    $: if (openRequests) {
        showRequests = true;
        onRequestsViewOpened?.();
    }

    $: favoriteRefresh = $favoritesStore;
    $: sortedTracks = [...tracks].sort((a, b) => a.rank - b.rank);
    $: pageCount = Math.max(1, Math.ceil(sortedTracks.length / PAGE_SIZE));
    $: visibleTracks = sortedTracks.slice(
        pageIndex * PAGE_SIZE,
        pageIndex * PAGE_SIZE + PAGE_SIZE
    );
    $: printedTrackPages = Array.from(
        {length: Math.ceil(sortedTracks.length / PRINT_TRACKS_PER_PAGE)},
        (_, page) => sortedTracks.slice(
            page * PRINT_TRACKS_PER_PAGE,
            (page + 1) * PRINT_TRACKS_PER_PAGE
        )
    );
    $: selectedIdentity = selectedTrack ? trackIdentity(selectedTrack) : '';

    $: {
        const identity = currentTrack ? trackIdentity(currentTrack) : '';

        if (identity !== lastCurrentIdentity) {
            lastCurrentIdentity = identity;
            selectedTrack = currentTrack;

            const currentIndex = currentTrack
                ? sortedTracks.findIndex(
                    track => trackIdentity(track) === identity
                )
                : -1;

            if (currentIndex >= 0) {
                pageIndex = Math.floor(currentIndex / PAGE_SIZE);
            }
        }
    }

    function trackIdentity(track: CarModeTrack): string {
        return track.rankingId != null
            ? `ranking-${track.rankingId}`
            : `rank-${track.rank}`;
    }

    function isCurrent(track: CarModeTrack): boolean {
        return currentTrack != null &&
            trackIdentity(track) === trackIdentity(currentTrack);
    }

    function previousPage(): void {
        if (pageIndex > 0) {
            pageIndex -= 1;
            selectedTrack = null;
        }
    }

    function nextPage(): void {
        if (pageIndex < pageCount - 1) {
            pageIndex += 1;
            selectedTrack = null;
        }
    }

    function chooseTrack(track: CarModeTrack): void {
        selectedTrack = track;
    }

    function playSelected(): void {
        if (!selectedTrack) return;
        onJumpToTrack?.(selectedTrack);
        onClose();
    }

    function exportCsv(): void {
        if (sortedTracks.length === 0) return;

        downloadCsv(createTrackListCsv(sortedTracks), exportFileName);
    }

    function isRequested(track: CarModeTrack): boolean {
        return requests.some(request => trackIdentity(request) === trackIdentity(track));
    }

    function addRequest(track: CarModeTrack): void {
        if (isRequested(track)) return;
        onAddRequest?.(track);
        requestConfirmation = requestsText.confirmation(track.rank);
        if (requestConfirmationTimer) clearTimeout(requestConfirmationTimer);
        requestConfirmationTimer = setTimeout(() => {
            requestConfirmation = '';
        }, 2500);
    }

    async function printTrackList(): Promise<void> {
        if (catalogLookupName && !printCatalogNumber) {
            try {
                const response = await fetch(`${getBackendUrl()}/api/catalog/programs`);
                const payload = await response.json() as {programs?: Array<{code?: string; name?: string; is_active?: boolean}>};
                const normalizedName = catalogLookupName.trim().toLocaleLowerCase();
                printCatalogNumber = payload.programs?.find(program =>
                    program.is_active && program.name?.trim().toLocaleLowerCase() === normalizedName
                )?.code ?? '';
            } catch {
                printCatalogNumber = '';
            }
        }
        await tick();
        window.print();
    }


    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            previousPage();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextPage();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        } else if (event.key === 'Enter' && selectedTrack) {
            event.preventDefault();
            playSelected();
        }
    }

    onMount(() => {
        if (!embedded) window.addEventListener('keydown', handleKeyDown);
    });
    onDestroy(() => {
        window.removeEventListener('keydown', handleKeyDown);
        if (requestConfirmationTimer) clearTimeout(requestConfirmationTimer);
    });
</script>

<div
        class:jukebox-overlay={!embedded}
        class:jukebox-embedded={embedded}
        role={embedded ? 'region' : 'dialog'}
        aria-modal={embedded ? undefined : 'true'}
        aria-label={copy.dialogLabel}
>
    <div class="jukebox-cabinet" class:embedded>
        {#if !embedded}
            <button
                    type="button"
                    class="close-button"
                    on:click={onClose}
                    aria-label={copy.close}
            >
                ✕
            </button>
        {/if}
        <div class="jukebox-display">
            <header>
                <div>
                    <span class="eyebrow">{eyebrow}</span>
                    <h2>{heading || copy.heading}</h2>

                    {#if programLabel}
                        <div class="program-label">{programLabel}</div>
                    {/if}
                </div>

                <div class="header-actions">
                    <div class="export-wrapper">
                        <button
                                type="button"
                                class="export-button"
                                on:click={exportCsv}
                                aria-describedby="export-csv-hint"
                        >
                            ↓ {copy.export}
                        </button>

                        <div
                                id="export-csv-hint"
                                class="export-tooltip"
                                role="tooltip"
                        >
                            {copy.exportHint}
                        </div>
                    </div>

                    {#if !embedded}
                        <div class="print-wrapper">
                            <button
                                    type="button"
                                    class="print-button"
                                    on:click={printTrackList}
                                    aria-describedby="print-list-hint"
                            >
                                {printLabel}
                            </button>
                            <div id="print-list-hint" class="print-tooltip" role="tooltip">
                                {printHint}
                            </div>
                        </div>
                    {/if}

                    <div class="page-label">
                        {copy.page(pageIndex + 1, pageCount)}
                    </div>
                    <button type="button" class="requests-button" on:click={() => (showRequests = !showRequests)}>
                        {requestsText.requests(requests.length)}
                    </button>
                </div>
            </header>

            {#if requestConfirmation}
                <p class="request-confirmation" role="status">{requestConfirmation}</p>
            {/if}

            {#if showRequests}
                <div class="requests-list">
                    <h3>{requestsText.requests(requests.length)}</h3>
                    {#each requests as request, index}
                        <div class="request-row">
                            <span>#{request.rank} <strong>{displayTrackListTitle(request.trackName, request.rank)}</strong> — {displayTrackListArtist(request.artistName)}</span>
                            <div class="request-controls">
                                <button type="button" disabled={index === 0} on:click={() => onMoveRequest?.(index, -1)}>{requestsText.moveUp}</button>
                                <button type="button" disabled={index === requests.length - 1} on:click={() => onMoveRequest?.(index, 1)}>{requestsText.moveDown}</button>
                                <button type="button" on:click={() => onRemoveRequest?.(index)}>{requestsText.remove}</button>
                            </div>
                        </div>
                    {:else}<p class="empty-tracks">{requestsText.empty}</p>{/each}
                    {#if requests.length}
                        {#if clearRequestsConfirmation}
                            <button type="button" class="clear-requests" on:click={() => { onClearRequests?.(); clearRequestsConfirmation = false; }}>{requestsText.confirmClear(requests.length)}</button>
                        {:else}
                            <button type="button" class="clear-requests" on:click={() => (clearRequestsConfirmation = true)}>{requestsText.clear}</button>
                        {/if}
                    {/if}
                </div>
            {:else}
            <div class="selection-list">
                {#each visibleTracks as track}
                    <div
                            class="selection-card"
                            class:current={isCurrent(track)}
                            class:selected={!embedded && selectedIdentity === trackIdentity(track)}
                            role="button"
                            tabindex={embedded ? undefined : 0}
                            aria-disabled={embedded}
                            on:click={() => chooseTrack(track)}
                            on:keydown={(event) => {
                            if (!embedded && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                chooseTrack(track);
                            }
                        }}
                            aria-pressed={embedded ? undefined : selectedIdentity === trackIdentity(track)}
                            aria-label={copy.selectTrackAria(track.rank, track.trackName, track.artistName)}
                    >
                        <span class="selection-code">
                            #{track.rank}
                        </span>

                        <img
                                src={track.albumArtwork ?? '/default_album.png'}
                                alt=""
                        />

                        <span class="track-copy">
                            <strong>{displayTrackListTitle(track.trackName, track.rank)}</strong>
                            <span>{displayTrackListArtist(track.artistName)}</span>
                        </span>

                        {#if !embedded}
                            <button type="button" class="add-request" disabled={isRequested(track)} on:click|stopPropagation={() => addRequest(track)}>
                                {isRequested(track) ? requestsText.queued : requestsText.add(track.rank)}
                            </button>
                        {/if}

                        <span class="status-icons">
                            {#if isCurrent(track)}
                                <span class="now-playing">{copy.playing}</span>
                            {:else if isPlayed(track.rank)}
                                <span class="played" title={copy.alreadyPlayed}>✓</span>
                            {/if}

                            <button
                                    type="button"
                                    class="favorite"
                                    class:active={
                                    favoriteRefresh &&
                                    programType &&
                                    programGroup &&
                                    track.rankingId != null &&
                                    isFavorite(
                                        programType,
                                        programGroup,
                                        track.rankingId
                                    )
                                }
                                    on:click|stopPropagation={() => {
                                    if (
                                        programType &&
                                        programGroup &&
                                        track.rankingId != null
                                    ) {
                                        toggleFavorite(
                                            programType,
                                            programGroup,
                                            track.rankingId
                                        );
                                    }
                                }}
                                    aria-label={copy.favorite(track.trackName)}
                            >
                                ★
                            </button>
                        </span>
                    </div>
                {/each}
                {#if visibleTracks.length === 0}
                    <p class="empty-tracks">{copy.empty}</p>
                {/if}
            </div>
            {/if}

            <footer>
                <button
                        type="button"
                        class="page-turn"
                        on:click={previousPage}
                        disabled={pageIndex === 0}
                        aria-label={copy.previousAria}
                >
                    ‹
                    <span>{copy.previous}</span>
                </button>

                {#if !embedded}
                    <button
                            type="button"
                            class="play-selected"
                            on:click={playSelected}
                            disabled={!selectedTrack}
                    >
                        <span aria-hidden="true">▶</span>
                        {selectedTrack
                            ? copy.playRank(selectedTrack.rank)
                            : copy.selectTrack}
                    </button>
                {/if}

                <button
                        type="button"
                        class="page-turn"
                        on:click={nextPage}
                        disabled={pageIndex === pageCount - 1}
                        aria-label={copy.nextAria}
                >
                    <span>{copy.next}</span>
                    ›
                </button>
            </footer>
        </div>
    </div>
</div>

{#if !embedded}
    <section class="print-list" aria-hidden="true">
        {#each printedTrackPages as printedTracks}
            <section class="print-page">
                <p class="print-catalog-line">{printCatalogNumber}{printCatalogNumber && printCategory ? '\u00a0\u00a0' : ''}{printCategory}</p>
                <h1>{printTitle || programLabel || heading || copy.heading}</h1>
                <ol>
                    {#each printedTracks as track}
                        <li>
                            <span class="print-rank">#{track.rank}</span>
                            <span class="print-track">{displayTrackListTitle(track.trackName, track.rank)}</span>
                            <span class="print-artist">{displayTrackListArtist(track.artistName)}</span>
                        </li>
                    {/each}
                </ol>
            </section>
        {/each}
    </section>
{/if}

<style>
    .jukebox-overlay {
        position: fixed;
        z-index: 100;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 8px;
        background: rgba(0, 0, 0, 0.88);
    }

    .jukebox-cabinet {
        position: relative;
        width: min(98vw, calc(98dvh * 1.7768));
        max-width: 1672px;
        aspect-ratio: 1672 / 941;
        background: url('/images/car/drive-in-jukebox-frame.png') center / contain no-repeat;
        color: #f9edc7;
        font-family: Arial, Helvetica, sans-serif;
    }

    .close-button {
        position: absolute;
        z-index: 3;
        top: 5.5%;
        right: 7%;
        width: clamp(42px, 3.6vw, 62px);
        height: clamp(42px, 3.6vw, 62px);
        border: 2px solid #e2bc68;
        border-radius: 50%;
        background: rgba(22, 10, 5, 0.94);
        color: #fff5d3;
        font-size: clamp(20px, 1.8vw, 30px);
        cursor: pointer;
        box-shadow: 0 0 18px rgba(255, 174, 55, 0.5);
    }

    .jukebox-display {
        position: absolute;
        left: 16.5%;
        top: 22.3%;
        width: 69%;
        height: 59%;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: clamp(4px, 0.55vw, 10px);
        padding: clamp(8px, 1vw, 17px);
        border: 1px solid rgba(244, 194, 91, 0.45);
        border-radius: 8px;
        background: linear-gradient(rgba(10, 5, 3, 0.93), rgba(21, 9, 4, 0.93)),
        repeating-linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.025) 0,
                rgba(255, 255, 255, 0.025) 1px,
                transparent 1px,
                transparent 4px
        );
        box-shadow: inset 0 0 30px #000;
        overflow: visible;
    }

    .header-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
    }

    .export-wrapper,
    .print-wrapper {
        position: relative;
    }

    .export-tooltip,
    .print-tooltip {
        position: absolute;
        z-index: 10;
        right: 0;
        bottom: calc(100% + 8px);
        width: 280px;
        padding: 9px 12px;

        border: 1px solid #d9aa3a;
        border-radius: 8px;

        background: rgba(20, 11, 4, 0.98);
        color: #f6e4b2;

        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1.35;

        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);

        opacity: 0;
        visibility: hidden;
        transform: translateY(4px);

        transition: opacity 0.15s ease,
        transform 0.15s ease,
        visibility 0.15s ease;

        pointer-events: none;
    }

    .export-wrapper:hover .export-tooltip,
    .export-wrapper:focus-within .export-tooltip,
    .print-wrapper:hover .print-tooltip,
    .print-wrapper:focus-within .print-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .export-button,
    .print-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-height: 34px;
        padding: 6px 14px;

        border: 1px solid #d9aa3a;
        border-radius: 999px;

        background: linear-gradient(
                180deg,
                rgba(73, 43, 10, 0.96),
                rgba(25, 14, 4, 0.98)
        );

        color: #f6d77a;

        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.03em;

        cursor: pointer;

        box-shadow: inset 0 1px 0 rgba(255, 232, 164, 0.18),
        0 2px 8px rgba(0, 0, 0, 0.45);

        transition: background 0.15s ease,
        color 0.15s ease,
        transform 0.15s ease,
        box-shadow 0.15s ease;
    }

    .export-button:hover,
    .export-button:focus-visible,
    .print-button:hover,
    .print-button:focus-visible {
        background: linear-gradient(
                180deg,
                #f5cf69,
                #d69b27
        );

        color: #1b1004;

        box-shadow: 0 0 12px rgba(239, 183, 59, 0.55);

        outline: none;
    }

    .export-button:active,
    .print-button:active {
        transform: translateY(1px);
    }

    header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 6px;
        min-height: 0;
        padding: 0 clamp(2px, 0.5vw, 8px);
    }

    .eyebrow {
        color: #dfad49;
        font-size: clamp(8px, 0.72vw, 13px);
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    h2 {
        margin: 0.05em 0 0;
        color: #fff6d5;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(14px, 1.45vw, 26px);
        line-height: 1;
        text-shadow: 0 0 10px rgba(255, 187, 54, 0.45);
    }

    .program-label {
        margin-top: 0.28em;
        color: #e3bd68;
        font-size: clamp(9px, 0.8vw, 14px);
        font-weight: 800;
        letter-spacing: 0.02em;
    }

    .page-label {
        border: 1px solid rgba(231, 183, 84, 0.65);
        border-radius: 999px;
        padding: 0.35em 0.8em;
        color: #f2ce82;
        font-size: clamp(9px, 0.78vw, 14px);
        font-weight: 800;
        white-space: nowrap;
    }

    .selection-list {
        min-height: 0;
        display: grid;
        grid-template-rows: repeat(5, minmax(0, 1fr));
        gap: clamp(3px, 0.45vw, 8px);
    }

    .selection-card {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns:
            clamp(32px, 3.2vw, 54px)
            clamp(42px, 4.8vw, 76px)
            minmax(0, 1fr)
            auto
            auto;
        align-items: center;
        gap: clamp(6px, 0.75vw, 13px);
        padding: clamp(3px, 0.35vw, 6px) clamp(7px, 0.8vw, 14px);
        border: 1px solid rgba(202, 153, 66, 0.45);
        border-radius: 8px;
        background: linear-gradient(
                90deg,
                rgba(61, 24, 12, 0.88),
                rgba(24, 12, 8, 0.92)
        );
        color: #f5e7c4;
        text-align: left;
        cursor: pointer;
        overflow: hidden;
    }

    .selection-card:hover,
    .selection-card:focus-visible {
        border-color: #f4c55f;
        outline: none;
    }

    .selection-card.current {
        border-color: #31d875;
        box-shadow: inset 4px 0 0 #31d875;
    }

    .selection-card.selected {
        border-color: #ffd568;
        background: linear-gradient(
                90deg,
                rgba(111, 47, 18, 0.96),
                rgba(49, 23, 10, 0.97)
        );
        box-shadow: inset 0 0 12px rgba(255, 198, 72, 0.22),
        0 0 9px rgba(255, 177, 42, 0.28);
    }

    .selection-code {
        color: #ffe08c;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(15px, 1.45vw, 25px);
        font-weight: 900;
        text-align: center;
    }

    .selection-card > img {
        width: 100%;
        height: 100%;
        max-height: clamp(38px, 5.4dvh, 68px);
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border: 1px solid rgba(255, 224, 148, 0.55);
        border-radius: 5px;
        background: #1b110c;
    }

    .track-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.15em;
    }

    .track-copy strong,
    .track-copy span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .track-copy strong {
        color: #fff8e5;
        font-size: clamp(11px, 1vw, 18px);
    }

    .track-copy span {
        color: #d5b875;
        font-size: clamp(9px, 0.85vw, 15px);
        font-weight: 700;
    }

    .status-icons {
        display: flex;
        align-items: center;
        gap: clamp(5px, 0.55vw, 9px);
    }

    .now-playing {
        color: #46e784;
        font-size: clamp(8px, 0.7vw, 12px);
        font-weight: 900;
        text-transform: uppercase;
    }

    .played {
        color: #70e49b;
        font-size: clamp(15px, 1.3vw, 22px);
        font-weight: 900;
    }

    .favorite {
        width: clamp(34px, 3vw, 48px);
        height: clamp(34px, 3vw, 48px);
        border: 1px solid rgba(232, 188, 93, 0.55);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        color: #766246;
        font-size: clamp(16px, 1.45vw, 25px);
        cursor: pointer;
    }

    .favorite.active {
        color: #ffd55f;
        text-shadow: 0 0 8px #ffad25;
    }

    footer {
        display: grid;
        grid-template-columns: 1fr minmax(140px, 1.35fr) 1fr;
        align-items: center;
        gap: clamp(6px, 0.8vw, 14px);
    }

    footer button {
        min-height: clamp(38px, 5dvh, 58px);
        border: 1px solid #c58d35;
        border-radius: 999px;
        font-weight: 900;
        cursor: pointer;
    }

    footer button:disabled {
        cursor: default;
        opacity: 0.35;
    }

    .page-turn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4em;
        background: linear-gradient(#462213, #1b0c07);
        color: #f8d886;
        font-size: clamp(18px, 1.8vw, 31px);
    }

    .page-turn span {
        font-size: clamp(9px, 0.8vw, 14px);
        text-transform: uppercase;
    }

    .play-selected {
        background: linear-gradient(#f0c45d, #a86318);
        color: #1a0b04;
        font-size: clamp(11px, 1vw, 18px);
        box-shadow: 0 0 15px rgba(255, 175, 42, 0.38);
    }

    .jukebox-embedded {
        width: 100%;
    }

    .jukebox-cabinet.embedded {
        width: 100%;
        max-width: none;
        aspect-ratio: auto;
        background: none;
    }

    .jukebox-cabinet.embedded .jukebox-display {
        position: relative;
        inset: auto;
        width: 100%;
        height: auto;
        min-height: 560px;
        gap: 10px;
        padding: clamp(12px, 2vw, 20px);
        border-color: rgba(244, 194, 91, 0.62);
        border-radius: 18px;
    }

    .jukebox-cabinet.embedded .selection-list {
        min-height: 430px;
        gap: 7px;
    }

    .jukebox-cabinet.embedded .selection-card {
        grid-template-columns: 54px 64px minmax(0, 1fr);
        min-height: 76px;
        cursor: default;
    }

    .jukebox-cabinet.embedded .selection-card:hover {
        border-color: rgba(202, 153, 66, 0.45);
    }

    .jukebox-cabinet.embedded .status-icons {
        display: none;
    }

    .jukebox-cabinet.embedded footer {
        grid-template-columns: 1fr 1fr;
    }

    .print-list {
        display: none;
    }

    .requests-button, .add-request, .request-controls button, .clear-requests { border: 1px solid #c58d35; border-radius: 8px; padding: 6px 9px; color: #fff4d1; background: #3d1c0e; font-weight: 800; cursor: pointer; }
    .requests-list { min-height: 0; overflow: auto; padding: 8px; border: 1px solid rgba(202,153,66,.45); border-radius: 8px; background: rgba(24,12,8,.92); }
    .requests-list h3 { margin: 0 0 8px; }
    .request-row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(202,153,66,.25); }
    .request-controls { display: flex; flex-wrap: wrap; gap: 5px; }
    .request-confirmation { color:#70e49b; font-weight:800; }
    .clear-requests { margin-top: 10px; background:#7f1d1d; }
    .add-request { white-space: nowrap; font-size: clamp(8px,.75vw,12px); }
    .add-request:disabled { opacity:.65; cursor:default; }

    @media print {
        @page {
            size: letter portrait;
            margin: 0.45in 0.55in;
        }

        :global(html),
        :global(body) {
            background: #fff !important;
        }

        .jukebox-overlay {
            display: none !important;
        }
        :global(body *) {
            visibility: hidden;
        }

        .print-list,
        .print-list * {
            visibility: visible;
        }

        .print-list {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            display: block;
            box-sizing: border-box;
            padding: 0;
            color: #000;
            background: #fff;
            font-family: Arial, Helvetica, sans-serif;
        }

        .export-tooltip,
        .print-tooltip {
            display: none !important;
        }

        .print-page {
            break-after: page;
            page-break-after: always;
        }

        .print-page:last-child {
            break-after: auto;
            page-break-after: auto;
        }

        .print-page p,
        .print-page h1 {
            margin: 0;
        }

        .print-page p {
            font-size: 11pt;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .print-page h1 {
            margin-top: 4pt;
            font-size: 21pt;
        }

        .print-page ol {
            margin: 14pt 0 0;
            padding: 0;
            list-style: none;
        }

        .print-page li {
            break-inside: avoid;
            page-break-inside: avoid;
            margin: 0 0 6pt;
            font-size: 16pt;
            line-height: 1.16;
        }

        .print-rank {
            font-weight: 800;
        }

        .print-track {
            font-weight: 700;
        }

        .print-artist {
            color: #222;
        }

        .print-track::after {
            content: ' — ';
        }
    }

    @media (max-width: 900px) {
        .jukebox-overlay {
            padding: 2px;
        }

        .jukebox-cabinet {
            width: min(100vw, calc(100dvh * 1.7768));
        }

        .jukebox-display {
            left: 13%;
            top: 17%;
            width: 74%;
            height: 67%;
        }
    }

    @media (orientation: portrait) {
        .jukebox-cabinet {
            width: 100vw;
        }

        .jukebox-display {
            left: 7%;
            top: 9%;
            width: 86%;
            height: 82%;
            background: rgba(16, 8, 4, 0.97);
        }

        .close-button {
            top: 2%;
            right: 2%;
        }

        .selection-card {
            grid-template-columns: 36px 44px minmax(0, 1fr) auto;
        }

        .selection-card .add-request {
            grid-column: 3 / -1;
            justify-self: start;
        }

        .request-row {
            flex-direction: column;
        }
    }
</style>
