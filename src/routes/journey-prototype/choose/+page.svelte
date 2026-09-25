<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount, tick} from 'svelte';
    import posthog from 'posthog-js';
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import {readStoredLanguagePreference} from '$lib/languagePreferences';
    import {captureExperienceSelected} from '$lib/analytics/posthog';
    import {buildExperienceDestination, EXPERIENCE_FAMILIES, type ExperienceFamily, type ExperienceMode} from '$lib/journey/experienceMode';
    import {lookupProgramCode, ProgramCodeLookupError, programCodeUrl} from '$lib/api/programCode.js';
    import artistSpotlights from '$lib/catalog/artistSpotlights.json';
    import {findArtistsByTrack, type ArtistTrackResult} from '$lib/api/artistTrackSearch';

    type LandingLanguage = 'en' | 'es' | 'ptbr';
    let language: LandingLanguage = 'en';
    let selectedProgram: ExperienceFamily | null = null;
    let showJourneyLayout = false;
    let catalogDigits = '';
    let catalogStatus: string | null = null;
    let catalogStatusKind: 'error' | 'status' | null = null;
    let lookingUpCatalog = false;
    let catalogDestination: string | null = null;
    let requestedTrackId: number | null = null;
    let catalogLookupVersion = 0;
    let catalogLookupTimer: ReturnType<typeof setTimeout> | null = null;
    let showNostalgiaBrowser = false;
    let showCollectionsBrowser = false;
    let showArtistsBrowser = false;
    let showTrackSearch = false;
    let browserDecade = 0;
    let collectionGroupIndex = 0;
    let artistLetter = 'A';
    let artistSearch = '';
    let artistSearchInput: HTMLInputElement;
    let artistLetterSelect: HTMLSelectElement;
    let trackSearchInput: HTMLInputElement;
    let trackQuery = '';
    let trackResults: ArtistTrackResult[] = [];
    let trackSearchState: 'idle' | 'loading' | 'done' | 'error' = 'idle';
    let trackSearchTimer: ReturnType<typeof setTimeout> | null = null;
    let trackSearchController: AbortController | null = null;
    let browserCloseButton: HTMLButtonElement;
    let browserDialog: HTMLDivElement;
    let browserReturnFocus: HTMLElement | null = null;

    const nostalgiaDecades = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
    const nostalgiaGenres = [
        'country', 'pop', 'rock', 'rnb_soul', 'latin_global', 'blues_jazz', 'folk_acoustic', 'tv_themes'
    ] as const;
    const nostalgiaGenreLabels: Record<LandingLanguage, string[]> = {
        en: ['Country', 'Pop', 'Rock', 'R&B / Soul', 'Latin / Global', 'Blues / Jazz', 'Folk / Acoustic', 'TV Themes'],
        es: ['Country', 'Pop', 'Rock', 'R&B / Soul', 'Latina / Global', 'Blues / Jazz', 'Folk / Acústica', 'Temas de TV'],
        ptbr: ['Country', 'Pop', 'Rock', 'R&B / Soul', 'Latina / Global', 'Blues / Jazz', 'Folk / Acústico', 'Temas de TV']
    };
    const nostalgiaBrowserCopy: Record<LandingLanguage, {open: string; title: string; instruction: string; genre: string; decade: string; close: string}> = {
        en: {open: 'Browse Nostalgia numbers', title: 'Nostalgia Program Numbers', instruction: 'Choose a decade and genre to open its program.', genre: 'Genre', decade: 'Decade', close: 'Close'},
        es: {open: 'Ver números de Nostalgia', title: 'Números de programas de Nostalgia', instruction: 'Elige una década y un género para abrir el programa.', genre: 'Género', decade: 'Década', close: 'Cerrar'},
        ptbr: {open: 'Ver números de Nostalgia', title: 'Números dos programas de Nostalgia', instruction: 'Escolha uma década e um gênero para abrir o programa.', genre: 'Gênero', decade: 'Década', close: 'Fechar'}
    };
    const collectionGroups = [
        {name: 'American Heritage Favorites', items: [['C-002', 'American Folk Heroes'], ['C-006', 'Civil War Songs'], ['C-037', 'Patriotic Favorites'], ['C-041', 'Railroad & Train Songs'], ['C-051', 'Western Heritage Favorites']]},
        {name: 'Traditional Favorites', items: [['C-003', 'Bluegrass Favorites'], ['C-011', 'Cowboy Songs & Western Favorites'], ['C-012', 'Crooner Classics'], ['C-021', 'Great American Songbook'], ['C-045', 'Southern Gospel Favorites'], ['C-048', 'Traditional Hymns']]},
        {name: 'World Heritage Favorites', items: [['C-001', 'African-American Heritage Favorites'], ['C-004', 'Brazilian Classics'], ['C-005', 'Celtic Favorites'], ['C-020', 'German Heritage Favorites'], ['C-023', 'Italian Favorites'], ['C-033', 'Mexican-American Favorites'], ['C-049', 'Traditional Mexican Favorites']]},
        {name: 'Soft Rock 70s-90s', items: [['C-017', 'Easy Listening'], ['C-042', 'Road Trip'], ['C-043', 'Singer-Songwriter'], ['C-044', 'Soft Rock Love Songs'], ['C-052', 'Yacht Rock']]},
        {name: 'Music Trends', items: [['C-013', 'Dance Floor Anthems'], ['C-014', 'Disco Favorites'], ['C-034', 'Motown Magic'], ['C-036', 'One-Hit Wonders'], ['C-039', 'Power Ballads'], ['C-040', 'Protest & Social Justice']]},
        {name: 'Music Legends', items: [['C-025', 'Legends – Blues Jazz'], ['C-026', 'Legends – Country'], ['C-027', 'Legends – Folk Acoustic'], ['C-028', 'Legends – Latin Global'], ['C-029', 'Legends – Pop'], ['C-030', 'Legends – RnB Soul'], ['C-031', 'Legends – Rock'], ['C-032', 'Legends – TV Themes']]},
        {name: 'Stage & Screen', items: [['C-015', 'Disney: Classics (Pre-1988)'], ['C-016', 'Disney: Revival (After-1988)'], ['C-046', 'Stage & Screen: Broadway Classics'], ['C-047', 'Stage & Screen: Movie Themes'], ['C-050', 'Video Game Themes']]},
        {name: 'Classical Music', items: [['C-007', 'Classical Music: Baroque Period (1600-1750)'], ['C-008', 'Classical Music: Classical Period (1750-1820)'], ['C-009', 'Classical Music: Romantic Period (1820-1910)']]},
        {name: 'Specialty Mixes', items: [['C-010', 'Country Duets'], ['C-018', "Gary's Missing Country Favorites"], ['C-019', "Gary's Missing Rock & Pop Favorites"], ['C-022', 'Holiday Favorites'], ['C-024', 'Latin Crossovers'], ['C-035', 'Novelty Songs'], ['C-038', 'Pop Duets']]}
    ];
    const collectionsBrowserCopy: Record<LandingLanguage, {open: string; title: string; instruction: string; group: string; close: string}> = {
        en: {open: 'Browse Collections numbers', title: 'Collections Program Numbers', instruction: 'Choose a collection to open its program. Names match the printed catalog.', group: 'Collection group', close: 'Close'},
        es: {open: 'Ver números de Colecciones', title: 'Números de programas de Colecciones', instruction: 'Elige una colección para abrir el programa. Los nombres coinciden con el catálogo impreso.', group: 'Grupo de colecciones', close: 'Cerrar'},
        ptbr: {open: 'Ver números de Coleções', title: 'Números dos programas de Coleções', instruction: 'Escolha uma coleção para abrir o programa. Os nomes correspondem ao catálogo impresso.', group: 'Grupo de coleções', close: 'Fechar'}
    };
    const artistsBrowserCopy: Record<LandingLanguage, {open: string; searchLink: string; trackLink: string; title: string; instruction: string; letter: string; search: string; noResults: string; close: string; trackTitle: string; trackInstruction: string; trackPlaceholder: string; trackHint: string; trackLoading: string; trackEmpty: string; trackError: string}> = {
        en: {open: 'Browse Artist Numbers', searchLink: 'Search by Artist Name', trackLink: 'Find Artist by Track Name', title: 'Artist Spotlight Numbers', instruction: 'Choose a letter or search an artist to open a spotlight.', letter: 'Starting letter', search: 'Search artists', noResults: 'No matching artists.', close: 'Close', trackTitle: 'Find Artist by Track Name', trackInstruction: 'Search songs recorded by artists with a TopSpot40 Artist Spotlight.', trackPlaceholder: 'Enter at least two letters of a track title', trackHint: 'Enter at least two letters to search.', trackLoading: 'Searching tracks…', trackEmpty: 'No matching tracks by Spotlight artists.', trackError: 'Track search is unavailable. Please try again.'},
        es: {open: 'Ver números de artistas', searchLink: 'Buscar por nombre de artista', trackLink: 'Encontrar artista por canción', title: 'Números de artistas destacados', instruction: 'Elige una letra o busca un artista para abrir su programa.', letter: 'Letra inicial', search: 'Buscar artistas', noResults: 'No se encontraron artistas.', close: 'Cerrar', trackTitle: 'Encontrar artista por canción', trackInstruction: 'Busca canciones grabadas por artistas con un programa destacado en TopSpot40.', trackPlaceholder: 'Escribe al menos dos letras del título', trackHint: 'Escribe al menos dos letras para buscar.', trackLoading: 'Buscando canciones…', trackEmpty: 'No hay canciones coincidentes de artistas destacados.', trackError: 'La búsqueda no está disponible. Inténtalo de nuevo.'},
        ptbr: {open: 'Ver números de artistas', searchLink: 'Buscar pelo nome do artista', trackLink: 'Encontrar artista pela música', title: 'Números de artistas em destaque', instruction: 'Escolha uma letra ou procure um artista para abrir o programa.', letter: 'Letra inicial', search: 'Procurar artistas', noResults: 'Nenhum artista encontrado.', close: 'Fechar', trackTitle: 'Encontrar artista pela música', trackInstruction: 'Busque músicas gravadas por artistas com um programa em destaque no TopSpot40.', trackPlaceholder: 'Digite pelo menos duas letras do título', trackHint: 'Digite pelo menos duas letras para buscar.', trackLoading: 'Buscando músicas…', trackEmpty: 'Nenhuma música encontrada de artistas em destaque.', trackError: 'A busca está indisponível. Tente novamente.'}
    };
    const artistLetters = [...new Set(artistSpotlights.map(artist => artist.name[0].toUpperCase()))].sort();
    $: visibleArtists = artistSpotlights.filter(artist => artistSearch.trim()
        ? `${artist.name} ${artist.code}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(artistSearch.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
        : artist.name.toUpperCase().startsWith(artistLetter));

    function nostalgiaCode(decadeIndex: number, genreIndex: number) {
        return `N-${String(decadeIndex * nostalgiaGenres.length + genreIndex + 1).padStart(3, '0')}`;
    }

    async function openNostalgiaBrowser(event: MouseEvent) {
        browserReturnFocus = event.currentTarget as HTMLElement;
        showNostalgiaBrowser = true;
        await tick();
        browserCloseButton?.focus();
    }

    async function openCollectionsBrowser(event: MouseEvent) {
        browserReturnFocus = event.currentTarget as HTMLElement;
        showCollectionsBrowser = true;
        await tick();
        browserCloseButton?.focus();
    }

    async function openArtistsBrowser(event: MouseEvent, focus: 'letter' | 'search' = 'letter') {
        browserReturnFocus = event.currentTarget as HTMLElement;
        artistSearch = '';
        showArtistsBrowser = true;
        await tick();
        (focus === 'search' ? artistSearchInput : artistLetterSelect)?.focus();
    }

    async function openTrackSearch(event: MouseEvent) {
        browserReturnFocus = event.currentTarget as HTMLElement;
        trackQuery = '';
        trackResults = [];
        trackSearchState = 'idle';
        showTrackSearch = true;
        await tick();
        trackSearchInput?.focus();
    }

    function stopTrackSearch() {
        if (trackSearchTimer) clearTimeout(trackSearchTimer);
        trackSearchTimer = null;
        trackSearchController?.abort();
        trackSearchController = null;
    }

    function updateTrackSearch() {
        stopTrackSearch();
        trackResults = [];
        const query = trackQuery.trim();
        if (query.length < 2) {
            trackSearchState = 'idle';
            return;
        }
        trackSearchState = 'loading';
        trackSearchTimer = setTimeout(async () => {
            const controller = new AbortController();
            trackSearchController = controller;
            try {
                const results = await findArtistsByTrack(query, controller.signal);
                if (!controller.signal.aborted) {
                    trackResults = results;
                    trackSearchState = 'done';
                }
            } catch {
                if (!controller.signal.aborted) trackSearchState = 'error';
            }
        }, 250);
    }

    function closeTrackSearch() {
        stopTrackSearch();
        showTrackSearch = false;
        browserReturnFocus?.focus();
    }

    function closeNostalgiaBrowser() {
        showNostalgiaBrowser = false;
        browserReturnFocus?.focus();
    }

    function closeCollectionsBrowser() {
        showCollectionsBrowser = false;
        browserReturnFocus?.focus();
    }

    function closeArtistsBrowser() {
        showArtistsBrowser = false;
        browserReturnFocus?.focus();
    }

    function handleBrowserKeydown(event: KeyboardEvent) {
        if (!showNostalgiaBrowser && !showCollectionsBrowser && !showArtistsBrowser && !showTrackSearch) return;
        if (event.key === 'Escape') {
            if (showNostalgiaBrowser) closeNostalgiaBrowser();
            else if (showCollectionsBrowser) closeCollectionsBrowser();
            else if (showArtistsBrowser) closeArtistsBrowser();
            else closeTrackSearch();
        } else if (event.key === 'Tab') {
            const controls = Array.from(browserDialog.querySelectorAll<HTMLElement>('button:not(:disabled), select, input:not(:disabled)'))
                .filter(control => control.getClientRects().length > 0);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        }
    }

    async function openNostalgiaCode(code: string) {
        closeNostalgiaBrowser();
        await openCatalogCode(code, 'nostalgia');
    }

    async function openCollectionCode(code: string) {
        closeCollectionsBrowser();
        await openCatalogCode(code, 'collections');
    }

    async function openArtistCode(code: string) {
        closeArtistsBrowser();
        await openCatalogCode(code, 'artist');
    }

    async function openTrackArtistCode(track: ArtistTrackResult) {
        closeTrackSearch();
        await openCatalogCode(track.artist_code, 'artist', track.track_id);
    }

    async function openCatalogCode(code: string, family: ExperienceFamily, requestTrackId: number | null = null) {
        selectedProgram = family;
        requestedTrackId = requestTrackId;
        catalogDigits = code.slice(2);
        catalogLookupVersion += 1;
        if (catalogLookupTimer) clearTimeout(catalogLookupTimer);
        catalogLookupTimer = null;
        catalogDestination = null;
        catalogStatus = null;
        catalogStatusKind = null;
        lookingUpCatalog = true;
        await validateCatalogNumber(catalogLookupVersion);
        if (catalogDestination) goToCatalogProgram();
    }

    const text = {
        en: {
            title: 'Choose Your TopSpot40 Experience',
            instruction: 'Choose an experience, then enter a catalog number or browse programs.',
            continue: 'Continue',
            back: 'Back',
            home: 'Home',
            nostalgia: 'Nostalgia Programs',
            nostalgiaDesc: 'Music by decade and genre',
            collections: 'Collections Programs',
            collectionsDesc: 'Curated musical themes',
            artist: 'Artist Spotlights',
            artistDesc: 'Music and stories of legendary artists',
            docuseries: 'Music Docuseries',
            docuseriesDesc: 'Music history told in documentary series'
        },
        es: {
            title: 'Elige tu experiencia TopSpot40', instruction: 'Elige una experiencia y luego ingresa un número de catálogo o explora los programas.',
            continue: 'Continuar', back: 'Atrás', home: 'Inicio',
            nostalgia: 'Programas de Nostalgia', nostalgiaDesc: 'Música por década y género',
            collections: 'Programas de Colecciones', collectionsDesc: 'Temas musicales seleccionados',
            artist: 'Artistas Destacados', artistDesc: 'Música e historias de artistas legendarios',
            docuseries: 'Docuseries Musicales', docuseriesDesc: 'Historia musical en series documentales'
        },
        ptbr: {
            title: 'Escolha sua experiência TopSpot40', instruction: 'Escolha uma experiência e depois digite um número do catálogo ou explore os programas.',
            continue: 'Continuar', back: 'Voltar', home: 'Início',
            nostalgia: 'Programas de Nostalgia', nostalgiaDesc: 'Música por década e gênero',
            collections: 'Programas de Coleções', collectionsDesc: 'Temas musicais selecionados',
            artist: 'Destaques de Artistas', artistDesc: 'Música e histórias de artistas lendários',
            docuseries: 'Docusséries Musicais', docuseriesDesc: 'História musical em séries documentais'
        }
    };

    const choices = EXPERIENCE_FAMILIES;
    const catalogPrefixes: Record<ExperienceFamily, string> = {
        nostalgia: 'N-', collections: 'C-', artist: 'A-', docuseries: 'D-'
    };
    const catalogKinds: Record<ExperienceFamily, string> = {
        nostalgia: 'nostalgia', collections: 'collection', artist: 'artist_spotlight', docuseries: 'docuseries_story'
    };
    const catalogSettings = {
        languages: ['en'], voices: ['intro'], playbackOrder: 'up', voicePlayMode: 'before', pauseMode: 'pause', skipPlayed: false
    };
    const desktopInstruction: Record<LandingLanguage, string> = {
        en: "Choose an experience, then choose how you'd like to listen.",
        es: 'Elige una experiencia y luego elige cómo quieres escuchar.',
        ptbr: 'Escolha uma experiência e depois escolha como deseja ouvir.'
    };
    const modeCopy: Record<LandingLanguage, {program: string; radio: string}> = {
        en: {program: 'Program Mode', radio: 'Radio Mode'},
        es: {program: 'Modo Programa', radio: 'Modo Radio'},
        ptbr: {program: 'Modo Programa', radio: 'Modo Rádio'}
    };
    const mobileProgramCopy: Record<LandingLanguage, Record<ExperienceFamily, string>> = {
        en: {nostalgia: 'Browse by Decade', collections: 'Browse Collections', artist: 'Browse Artists', docuseries: 'Browse Docuseries'},
        es: {nostalgia: 'Explorar por década', collections: 'Explorar colecciones', artist: 'Explorar artistas', docuseries: 'Explorar docuseries'},
        ptbr: {nostalgia: 'Explorar por década', collections: 'Explorar coleções', artist: 'Explorar artistas', docuseries: 'Explorar docusséries'}
    };

    const catalogCopy: Record<LandingLanguage, {
        label: string; go: string; checking: string;
        notFound: string; wrongExperience: string; unavailable: string;
    }> = {
        en: {
            label: 'Catalog Number', go: 'Go', checking: 'Checking number…',
            notFound: 'We couldn’t find that catalog number. Please check the catalog and try again.',
            wrongExperience: 'That number belongs to a different TopSpot40 experience.',
            unavailable: 'That program cannot be opened because its catalog details are incomplete.'
        },
        es: {
            label: 'Número de catálogo', go: 'Ir', checking: 'Comprobando número…',
            notFound: 'No pudimos encontrar ese número de catálogo. Revise el catálogo e inténtelo de nuevo.',
            wrongExperience: 'Ese número pertenece a una experiencia TopSpot40 diferente.',
            unavailable: 'Ese programa no se puede abrir porque sus detalles de catálogo están incompletos.'
        },
        ptbr: {
            label: 'Número do catálogo', go: 'Ir', checking: 'Verificando número…',
            notFound: 'Não encontramos esse número de catálogo. Confira o catálogo e tente novamente.',
            wrongExperience: 'Esse número pertence a uma experiência TopSpot40 diferente.',
            unavailable: 'Esse programa não pode ser aberto porque os detalhes do catálogo estão incompletos.'
        }
    };

    function catalogText() {
        return catalogCopy[language];
    }

    function setProgram(choice: ExperienceFamily) {
        selectedProgram = choice;
        localStorage.setItem('topspot_journey_program', choice);
        clearCatalogEntry();
    }

    function clearCatalogEntry() {
        catalogLookupVersion += 1;
        if (catalogLookupTimer) clearTimeout(catalogLookupTimer);
        catalogLookupTimer = null;
        catalogDigits = '';
        catalogStatus = null;
        catalogStatusKind = null;
        catalogDestination = null;
        lookingUpCatalog = false;
    }

    function fullCatalogNumber() {
        return selectedProgram ? `${catalogPrefixes[selectedProgram]}${catalogDigits}` : '';
    }

    function updateCatalogDigits(event: Event) {
        catalogDigits = (event.currentTarget as HTMLInputElement).value.replace(/\D/g, '');
        catalogLookupVersion += 1;
        if (catalogLookupTimer) clearTimeout(catalogLookupTimer);
        catalogLookupTimer = null;
        catalogDestination = null;
        catalogStatus = null;
        catalogStatusKind = null;
        lookingUpCatalog = false;
        if (!catalogDigits || !selectedProgram) return;

        const lookupVersion = catalogLookupVersion;
        lookingUpCatalog = true;
        catalogLookupTimer = setTimeout(() => void validateCatalogNumber(lookupVersion), 250);
    }

    async function validateCatalogNumber(lookupVersion: number) {
        if (!selectedProgram || lookupVersion !== catalogLookupVersion) return;
        const selectedFamily = selectedProgram;
        try {
            const program = await lookupProgramCode(fullCatalogNumber());
            if (lookupVersion !== catalogLookupVersion || selectedProgram !== selectedFamily) return;
            if (program?.kind !== catalogKinds[selectedFamily]) {
                catalogStatus = catalogText().wrongExperience;
                catalogStatusKind = 'error';
                return;
            }
            catalogDestination = programCodeUrl(program, {...catalogSettings, language});
            if (catalogDestination && requestedTrackId !== null) {
                const destination = new URL(catalogDestination, window.location.origin);
                destination.searchParams.set('requestTrackId', String(requestedTrackId));
                catalogDestination = `${destination.pathname}${destination.search}`;
            }
            if (!catalogDestination) {
                catalogStatus = catalogText().unavailable;
                catalogStatusKind = 'error';
            }
        } catch (error) {
            if (lookupVersion !== catalogLookupVersion) return;
            catalogStatus = error instanceof ProgramCodeLookupError && error.kind === 'not-found'
                ? catalogText().notFound
                : catalogText().unavailable;
            catalogStatusKind = 'error';
        } finally {
            if (lookupVersion === catalogLookupVersion) lookingUpCatalog = false;
        }
    }

    function goToCatalogProgram() {
        if (!catalogDestination || !selectedProgram) return;
        captureExperienceSelected(posthog, selectedProgram);
        void goto(catalogDestination);
    }

    function description(choice: ExperienceFamily) {
        if (choice === 'nostalgia') return text[language].nostalgiaDesc;
        if (choice === 'collections') return text[language].collectionsDesc;
        if (choice === 'artist') return text[language].artistDesc;
        return text[language].docuseriesDesc;
    }

    function startExperience(mode: ExperienceMode) {
        if (!selectedProgram) return;
        captureExperienceSelected(posthog, selectedProgram);
        goto(buildExperienceDestination(selectedProgram, mode));
    }

    onMount(() => {
        const journeyScreen = window.matchMedia(
            '(min-width: 1200px) and (min-height: 650px)'
        );

        function updateLayout() {
            showJourneyLayout = journeyScreen.matches;
        }

        const savedLanguage = readStoredLanguagePreference();

        if (savedLanguage) {
            language = savedLanguage;
        }

        updateLayout();
        journeyScreen.addEventListener('change', updateLayout);

        return () => {
            journeyScreen.removeEventListener('change', updateLayout);
            if (catalogLookupTimer) clearTimeout(catalogLookupTimer);
            stopTrackSearch();
        };
    });
</script>

<svelte:window on:keydown={handleBrowserKeydown}/>

<svelte:head>
    <title>{text[language].title}</title>
    <meta name="description" content="Choose a TopSpot40 program experience."/>
</svelte:head>

<div class="prototype">
    <PublicJourneyHeader {language}/>
    {#if showJourneyLayout}
        <main class="journey">
            <img
                    class="journey-art"
                    src="/images/topspot-four-experiences.webp"
                    alt="Four TopSpot40 arches featuring a jukebox, record library, spotlight microphone, and documentary projector"
            />
            <div class="shade" aria-hidden="true"></div>
            <section class="journey-title"><h1>{text[language].title}</h1>
                <p>{desktopInstruction[language]}</p></section>
            <div class="choice-layer">
                {#each choices as choice}
                    <div class="arch-slot arch-{choice}">
                        <button class="program-choice" class:active={selectedProgram === choice}
                                aria-label={`${text[language][choice]}: ${description(choice)}`}
                                aria-pressed={selectedProgram === choice} on:click={() => setProgram(choice)}></button>
                        <div class="arch-content">
                            {#if selectedProgram === choice}
                                <form class="catalog-entry catalog-entry-desktop" on:submit|preventDefault={goToCatalogProgram}>
                                    <label for="desktop-catalog-digits">{catalogText().label}</label>
                                    <div class="catalog-row">
                                        <span class="catalog-prefix" aria-hidden="true">{catalogPrefixes[choice]}</span>
                                        <input id="desktop-catalog-digits" value={catalogDigits} on:input={updateCatalogDigits} inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="desktop-catalog-status" />
                                        <button type="submit" disabled={!catalogDestination || lookingUpCatalog}>{catalogText().go}</button>
                                    </div>
                                    {#if choice === 'nostalgia'}
                                        <button class="browse-nostalgia" type="button" on:click={openNostalgiaBrowser}>{nostalgiaBrowserCopy[language].open}</button>
                                    {:else if choice === 'collections'}
                                        <button class="browse-nostalgia" type="button" on:click={openCollectionsBrowser}>{collectionsBrowserCopy[language].open}</button>
                                    {:else if choice === 'artist'}
                                        <div class="artist-entry-links">
                                            <button class="browse-nostalgia" type="button" on:click={(event) => openArtistsBrowser(event)}>{artistsBrowserCopy[language].open}</button>
                                            <button class="browse-nostalgia" type="button" on:click={(event) => openArtistsBrowser(event, 'search')}>{artistsBrowserCopy[language].searchLink}</button>
                                            <button class="browse-nostalgia" type="button" on:click={openTrackSearch}>{artistsBrowserCopy[language].trackLink}</button>
                                        </div>
                                    {/if}
                                    <div id="desktop-catalog-status" class:catalog-error={catalogStatusKind === 'error'} role={catalogStatusKind === 'error' ? 'alert' : 'status'} aria-live="polite">{lookingUpCatalog ? catalogText().checking : catalogStatus ?? ''}</div>
                                </form>
                            {/if}
                            <span class="choice-label"><strong>{text[language][choice]}</strong><small>{description(choice)}</small></span>
                        </div>
                    </div>
                {/each}
            </div>
            {#if selectedProgram}
                <button type="button" class="mode-button program-mode" disabled={catalogDigits.length > 0} on:click={() => startExperience('program')}>{modeCopy[language].program} <span
                        aria-hidden="true">→</span></button>
                {#if selectedProgram !== 'docuseries'}
                    <button type="button" class="mode-button radio-mode" on:click={() => startExperience('radio')}>{modeCopy[language].radio} <span aria-hidden="true">→</span></button>
                {/if}
            {/if}
        </main>
    {:else}
        <main class="mobile-page">
            <section class="mobile-card">
                <img src="/old-dog-icon.png" alt="" class="mobile-logo"/>
                <h1>{text[language].title}</h1>
                <p>{text[language].instruction}</p>

                <div class="mobile-program-list">
                    {#each choices as choice}
                        <div class="mobile-choice">
                        <button class="mobile-browse" type="button" aria-pressed={selectedProgram === choice} on:click={() => setProgram(choice)}>
                        <span class="mobile-choice-text">
                            <strong>{text[language][choice]}</strong>
                            <small>{description(choice)}</small>
                        </span>
                            <span aria-hidden="true">
                            {selectedProgram === choice ? '✓' : '→'}
                        </span>
                        </button>
                        {#if selectedProgram === choice}
                            <form class="catalog-entry catalog-entry-mobile" on:submit|preventDefault={goToCatalogProgram}>
                                <label for="mobile-catalog-digits">{catalogText().label}</label>
                                <div class="catalog-row">
                                    <span class="catalog-prefix" aria-hidden="true">{catalogPrefixes[choice]}</span>
                                    <input id="mobile-catalog-digits" value={catalogDigits} on:input={updateCatalogDigits} inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="mobile-catalog-status" />
                                    <button type="submit" disabled={!catalogDestination || lookingUpCatalog}>{catalogText().go}</button>
                                </div>
                                {#if choice === 'nostalgia'}
                                    <button class="browse-nostalgia" type="button" on:click={openNostalgiaBrowser}>{nostalgiaBrowserCopy[language].open}</button>
                                {:else if choice === 'collections'}
                                    <button class="browse-nostalgia" type="button" on:click={openCollectionsBrowser}>{collectionsBrowserCopy[language].open}</button>
                                {:else if choice === 'artist'}
                                    <div class="artist-entry-links">
                                        <button class="browse-nostalgia" type="button" on:click={(event) => openArtistsBrowser(event)}>{artistsBrowserCopy[language].open}</button>
                                        <button class="browse-nostalgia" type="button" on:click={(event) => openArtistsBrowser(event, 'search')}>{artistsBrowserCopy[language].searchLink}</button>
                                        <button class="browse-nostalgia" type="button" on:click={openTrackSearch}>{artistsBrowserCopy[language].trackLink}</button>
                                    </div>
                                {/if}
                                <div id="mobile-catalog-status" class:catalog-error={catalogStatusKind === 'error'} role={catalogStatusKind === 'error' ? 'alert' : 'status'} aria-live="polite">{lookingUpCatalog ? catalogText().checking : catalogStatus ?? ''}</div>
                            </form>
                            <button class="mobile-program-route" type="button" on:click={() => startExperience('program')}>
                                {mobileProgramCopy[language][choice]} <span aria-hidden="true">→</span>
                            </button>
                        {/if}
                        </div>
                    {/each}
                </div>
            </section>
        </main>
    {/if}
    {#if showNostalgiaBrowser}
        <div class="browser-backdrop">
            <div class="browser-dialog" role="dialog" aria-modal="true" aria-labelledby="nostalgia-browser-title" aria-describedby="nostalgia-browser-instruction" bind:this={browserDialog}>
                <div class="browser-heading">
                    <div>
                        <h2 id="nostalgia-browser-title">{nostalgiaBrowserCopy[language].title}</h2>
                        <p id="nostalgia-browser-instruction">{nostalgiaBrowserCopy[language].instruction}</p>
                    </div>
                    <button class="browser-close" type="button" bind:this={browserCloseButton} on:click={closeNostalgiaBrowser} aria-label={nostalgiaBrowserCopy[language].close}>×</button>
                </div>
                {#if showJourneyLayout}
                    <table class="nostalgia-matrix">
                        <thead><tr><th scope="col">{nostalgiaBrowserCopy[language].genre}</th>{#each nostalgiaDecades as decade}<th scope="col">{decade}</th>{/each}</tr></thead>
                        <tbody>
                            {#each nostalgiaGenres as genre, genreIndex}
                                <tr><th scope="row">{nostalgiaGenreLabels[language][genreIndex]}</th>
                                    {#each nostalgiaDecades as _, decadeIndex}
                                        <td><button type="button" on:click={() => openNostalgiaCode(nostalgiaCode(decadeIndex, genreIndex))} aria-label={`${nostalgiaDecades[decadeIndex]} ${nostalgiaGenreLabels[language][genreIndex]}: ${nostalgiaCode(decadeIndex, genreIndex)}`}>{nostalgiaCode(decadeIndex, genreIndex)}</button></td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {:else}
                    <label class="browser-decade-label" for="browser-decade">{nostalgiaBrowserCopy[language].decade}</label>
                    <select id="browser-decade" bind:value={browserDecade}>
                        {#each nostalgiaDecades as decade, decadeIndex}<option value={decadeIndex}>{decade}</option>{/each}
                    </select>
                    <div class="browser-mobile-list">
                        {#each nostalgiaGenres as genre, genreIndex}
                            <button type="button" on:click={() => openNostalgiaCode(nostalgiaCode(browserDecade, genreIndex))}>
                                <span>{nostalgiaGenreLabels[language][genreIndex]}</span><strong>{nostalgiaCode(browserDecade, genreIndex)}</strong>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    {#if showCollectionsBrowser}
        <div class="browser-backdrop">
            <div class="browser-dialog collections-dialog" role="dialog" aria-modal="true" aria-labelledby="collections-browser-title" aria-describedby="collections-browser-instruction" bind:this={browserDialog}>
                <div class="browser-heading">
                    <div>
                        <h2 id="collections-browser-title">{collectionsBrowserCopy[language].title}</h2>
                        <p id="collections-browser-instruction">{collectionsBrowserCopy[language].instruction}</p>
                    </div>
                    <button class="browser-close" type="button" bind:this={browserCloseButton} on:click={closeCollectionsBrowser} aria-label={collectionsBrowserCopy[language].close}>×</button>
                </div>
                <div class="collections-desktop-groups">
                    {#each [0, 1, 2] as column}
                        <div class="collections-column">
                            {#each collectionGroups.slice(column * 3, column * 3 + 3) as group}
                                <section class="collections-group">
                                    <h3>{group.name}</h3>
                                    {#each group.items as [code, name]}
                                        <button type="button" on:click={() => openCollectionCode(code)} aria-label={`${code}: ${name}`}><strong>{code}</strong><span>{name}</span></button>
                                    {/each}
                                </section>
                            {/each}
                        </div>
                    {/each}
                </div>
                <div class="collections-mobile-groups">
                    <label class="browser-decade-label" for="collection-group">{collectionsBrowserCopy[language].group}</label>
                    <select id="collection-group" bind:value={collectionGroupIndex}>
                        {#each collectionGroups as group, index}<option value={index}>{group.name}</option>{/each}
                    </select>
                    <div class="browser-mobile-list">
                        {#each collectionGroups[collectionGroupIndex].items as [code, name]}
                            <button type="button" on:click={() => openCollectionCode(code)}><span>{name}</span><strong>{code}</strong></button>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
    {#if showArtistsBrowser}
        <div class="browser-backdrop">
            <div class="browser-dialog artists-dialog" role="dialog" aria-modal="true" aria-labelledby="artists-browser-title" aria-describedby="artists-browser-instruction" bind:this={browserDialog}>
                <div class="browser-heading">
                    <div>
                        <h2 id="artists-browser-title">{artistsBrowserCopy[language].title}</h2>
                        <p id="artists-browser-instruction">{artistsBrowserCopy[language].instruction}</p>
                    </div>
                    <button class="browser-close" type="button" bind:this={browserCloseButton} on:click={closeArtistsBrowser} aria-label={artistsBrowserCopy[language].close}>×</button>
                </div>
                <div class="artist-controls">
                    <div>
                        <label for="artist-letter">{artistsBrowserCopy[language].letter}</label>
                        <select id="artist-letter" bind:this={artistLetterSelect} bind:value={artistLetter} on:change={() => artistSearch = ''}>
                            {#each artistLetters as letter}<option value={letter}>{letter}</option>{/each}
                        </select>
                    </div>
                    <div>
                        <label for="artist-search">{artistsBrowserCopy[language].search}</label>
                        <input id="artist-search" type="search" bind:this={artistSearchInput} bind:value={artistSearch} autocomplete="off" placeholder={artistsBrowserCopy[language].search}/>
                    </div>
                </div>
                <div class="artists-results" aria-live="polite">
                    {#each visibleArtists as artist (artist.code)}
                        <button type="button" on:click={() => openArtistCode(artist.code)}><span>{artist.name}</span><strong>{artist.code}</strong></button>
                    {:else}
                        <p>{artistsBrowserCopy[language].noResults}</p>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
    {#if showTrackSearch}
        <div class="browser-backdrop">
            <div class="browser-dialog track-dialog" role="dialog" aria-modal="true" aria-labelledby="track-search-title" aria-describedby="track-search-instruction" bind:this={browserDialog}>
                <div class="browser-heading">
                    <div>
                        <h2 id="track-search-title">{artistsBrowserCopy[language].trackTitle}</h2>
                        <p id="track-search-instruction">{artistsBrowserCopy[language].trackInstruction}</p>
                    </div>
                    <button class="browser-close" type="button" bind:this={browserCloseButton} on:click={closeTrackSearch} aria-label={artistsBrowserCopy[language].close}>×</button>
                </div>
                <label class="track-search-label" for="track-query">{artistsBrowserCopy[language].trackTitle}</label>
                <input id="track-query" class="track-search-input" type="search" maxlength="100" bind:this={trackSearchInput} bind:value={trackQuery} on:input={updateTrackSearch} autocomplete="off" placeholder={artistsBrowserCopy[language].trackPlaceholder}/>
                <div class="track-search-results" role="status" aria-live="polite">
                    {#if trackSearchState === 'idle'}
                        <p>{artistsBrowserCopy[language].trackHint}</p>
                    {:else if trackSearchState === 'loading'}
                        <p>{artistsBrowserCopy[language].trackLoading}</p>
                    {:else if trackSearchState === 'error'}
                        <p>{artistsBrowserCopy[language].trackError}</p>
                    {:else if trackResults.length === 0}
                        <p>{artistsBrowserCopy[language].trackEmpty}</p>
                    {:else}
                        {#each trackResults as track (track.track_id)}
                            <button type="button" on:click={() => openTrackArtistCode(track)}>
                                <span><strong>{track.title}</strong><small>{track.artist}</small></span>
                                <strong class="track-artist-code">{track.artist_code}</strong>
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(html), :global(body) {
        margin: 0;
        min-height: 100%;
        background: #090705;
        color: #fff;
        font-family: Arial, sans-serif;
    }

    :global(*) {
        box-sizing: border-box;
    }

button {
    font: inherit;
}

    button {
        cursor: pointer;
    }

    .prototype {
        min-height: 100vh;
        background: #090705;
    }

    .journey {
        position: relative;
        height: calc(100vh - 72px);
        min-height: 650px;
        overflow: hidden;
        isolation: isolate;
    }

    .journey-art, .shade, .choice-layer {
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, calc((100vh - 72px) * 1.77683));
        aspect-ratio: 1672 / 941;
        transform: translate(-50%, -50%);
    }

    .journey-art {
        z-index: 1;
        display: block;
        height: auto;
        object-fit: fill;
    }

    .shade {
        z-index: 2;
        pointer-events: none;
        background: linear-gradient(to bottom, rgba(0, 0, 0, .42), transparent 27%, transparent 70%, rgba(0, 0, 0, .58));
    }

    .journey-title {
        position: absolute;
        z-index: 8;
        top: 5%;
        left: 50%;
        width: min(1180px, 84vw);
        transform: translateX(-50%);
        text-align: center;
        text-shadow: 0 3px 12px #000, 0 0 30px #000;
        pointer-events: none;
    }

    .journey-title h1 {
        margin: 0;
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: clamp(30px, 3.05vw, 54px);
        line-height: 1.05;
    }

    .journey-title p {
        margin: 9px 0 0;
        font-size: clamp(16px, 1.35vw, 22px);
        font-weight: 700;
    }

    .choice-layer {
        z-index: 5;
        pointer-events: none;
    }

    .arch-slot {
        position: absolute;
        top: 18%;
        width: 21.5%;
        height: 62%;
        pointer-events: none;
    }

    .arch-nostalgia { left: 1.75%; }
    .arch-collections { left: 26.75%; }
    .arch-artist { left: 51.75%; }
    .arch-docuseries { left: 76.75%; }

    .program-choice {
        position: absolute;
        inset: 0;
        padding: 0;
        border: 3px solid transparent;
        border-radius: 46% 46% 18px 18px;
        background: transparent;
        pointer-events: auto;
        transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
    }

    .program-choice:hover, .program-choice:focus-visible, .program-choice.active {
        outline: none;
        border-color: #74ff4f;
        background: rgba(22, 155, 67, .08);
        box-shadow: 0 0 18px #55ff3c, 0 0 48px rgba(55, 255, 56, .58), inset 0 0 40px rgba(55, 255, 56, .14);
    }

    .choice-label {
        display: block;
        width: 100%;
        padding: 12px 10px;
        color: #f6dc8a;
        background: rgba(8, 5, 2, .92);
        border: 2px solid rgba(226, 177, 62, .82);
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 5px 18px rgba(0, 0, 0, .72);
    }

    .choice-label strong, .choice-label small {
        display: block;
    }

    .choice-label strong {
        font-family: Georgia, serif;
        font-size: clamp(15px, 1.25vw, 22px);
    }

    .choice-label small {
        margin-top: 5px;
        color: #fff4d1;
        font-size: clamp(11px, .82vw, 14px);
    }

    .mode-button {
        position: absolute;
        z-index: 12;
        bottom: 2.5%;
        width: min(220px, 20vw);
        min-height: 54px;
        border-radius: 999px;
        font-size: 20px;
        font-weight: 900;
    }
    .program-mode {
        left: calc(50% - min(122px, 11vw));
        bottom: 2.5%;
        transform: translateX(-50%);
        color: #211706; background: #f7dc82; border: 2px solid #fff0b0; box-shadow: 0 0 28px rgba(247,220,130,.5);
    }
    .radio-mode { left: calc(50% + min(122px, 11vw)); transform: translateX(-50%); color:#081008; background:#75ef4f; border:2px solid #b7ff9c; box-shadow:0 0 28px rgba(78,255,73,.62); }
    .mode-button:hover, .mode-button:focus-visible { outline:3px solid #fff; outline-offset:3px; }
    .mode-button:disabled { cursor: not-allowed; opacity: .62; }

    .catalog-entry {
        z-index: 12;
        color: #fff4d1;
        background: rgba(8, 5, 2, .94);
        border: 1px solid rgba(247, 220, 130, .8);
        border-radius: 12px;
        box-shadow: 0 5px 18px rgba(0, 0, 0, .72);
    }

    .arch-content {
        position: absolute;
        z-index: 1;
        bottom: 4%;
        left: 50%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: min(94%, 300px);
        transform: translateX(-50%);
        pointer-events: none;
    }

    .catalog-entry-desktop {
        width: 100%;
        padding: 10px 14px;
        text-align: center;
        pointer-events: auto;
    }

    .catalog-entry label { display: block; margin-bottom: 4px; font-size: 13px; font-weight: 700; }
    .catalog-row { display: flex; gap: 7px; }
    .catalog-prefix, .catalog-row input, .catalog-row button { min-height: 38px; border-radius: 7px; font: inherit; }
    .catalog-prefix { display: grid; place-items: center; padding: 0 10px; color: #211706; background: #f7dc82; font-weight: 900; }
    .catalog-row input { min-width: 0; flex: 1; padding: 0 9px; color: #fff; background: #17120c; border: 1px solid #c9b76d; }
    .catalog-row button { padding: 0 13px; color: #211706; background: #f7dc82; border: 1px solid #fff0b0; font-weight: 900; }
    .catalog-row input:focus-visible, .catalog-row button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .catalog-row button:disabled { cursor: wait; opacity: .6; }
    .catalog-entry [role] { min-height: 1.2em; margin-top: 5px; font-size: 12px; }
    .catalog-entry .catalog-error { color: #ffb4a9; }
    .browse-nostalgia {
        margin-top: 8px;
        padding: 3px 6px;
        border: 0;
        background: transparent;
        color: #f7dc82;
        font-size: 13px;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    .browse-nostalgia:hover { color: #fff; }
    .browse-nostalgia:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .artist-entry-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 1px 8px; margin-top: 6px; }
    .artist-entry-links .browse-nostalgia { margin-top: 3px; }

    .browser-backdrop {
        position: fixed;
        z-index: 100;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(0, 0, 0, .82);
    }
    .browser-dialog {
        width: min(1100px, 100%);
        max-height: calc(100vh - 48px);
        overflow: auto;
        padding: 26px;
        border: 2px solid #dcb656;
        border-radius: 18px;
        color: #fff4d1;
        background: #17120c;
        box-shadow: 0 18px 70px #000;
    }
    .browser-heading { display: flex; align-items: start; justify-content: space-between; gap: 20px; }
    .browser-heading h2 { margin: 0; color: #f7dc82; font: bold clamp(23px, 3vw, 34px) Georgia, serif; }
    .browser-heading p { margin: 8px 0 20px; line-height: 1.4; }
    .browser-close { flex: none; width: 42px; height: 42px; border: 1px solid #dcb656; border-radius: 8px; color: #fff; background: #342814; font-size: 29px; line-height: 1; }
    .browser-close:focus-visible, .nostalgia-matrix button:focus-visible, .browser-mobile-list button:focus-visible, .browser-dialog select:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .nostalgia-matrix { width: 100%; border-collapse: collapse; text-align: center; }
    .nostalgia-matrix th, .nostalgia-matrix td { padding: 6px 4px; border-bottom: 1px solid #5d4c2c; }
    .nostalgia-matrix th:first-child { width: 155px; text-align: left; }
    .nostalgia-matrix thead th { color: #f7dc82; }
    .nostalgia-matrix tbody th { font-size: 14px; }
    .nostalgia-matrix tbody tr:nth-child(even) { background: #49351d; }
    .nostalgia-matrix tbody tr:nth-child(even) button { background: #594120; }
    .nostalgia-matrix tbody tr:hover { background: #705024; }
    .nostalgia-matrix tbody tr:hover button { border-color: #dcb656; }
    .nostalgia-matrix button { width: 100%; min-height: 42px; padding: 5px 2px; border: 1px solid #a8873d; border-radius: 7px; color: #fff4d1; background: #342814; font-size: 15px; font-weight: 700; }
    .nostalgia-matrix button:hover { color: #201605; background: #f7dc82; }
    .browser-decade-label { display: block; margin-bottom: 7px; font-weight: 700; }
    .browser-dialog select { width: 100%; min-height: 46px; padding: 8px 12px; border: 1px solid #dcb656; border-radius: 8px; color: #fff; background: #342814; font: inherit; }
    .browser-mobile-list { display: grid; gap: 8px; margin-top: 16px; }
    .browser-mobile-list button { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 50px; padding: 9px 14px; border: 1px solid #a8873d; border-radius: 8px; color: #fff4d1; background: #342814; text-align: left; font: inherit; }
    .browser-mobile-list button:hover { background: #4c3919; }
    .browser-mobile-list strong { color: #f7dc82; white-space: nowrap; }
    .collections-desktop-groups { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
    .collections-column { min-width: 0; }
    .collections-group { margin-bottom: 20px; }
    .collections-group h3 { margin: 0 0 6px; padding-bottom: 5px; border-bottom: 1px solid #a8873d; color: #f7dc82; font-size: 16px; }
    .collections-group button { display: flex; width: 100%; gap: 6px; padding: 4px 5px; border: 0; border-radius: 5px; color: #fff4d1; background: transparent; text-align: left; font: inherit; font-size: 13px; line-height: 1.25; }
    .collections-group button:nth-of-type(even) { background: #49351d; }
    .collections-group button:hover, .collections-group button:focus-visible { color: #1e1608; background: #f7dc82; outline: 2px solid #fff; outline-offset: 1px; }
    .collections-group button strong { flex: none; white-space: nowrap; }
    .collections-mobile-groups { display: none; }
    .artist-controls { display: grid; grid-template-columns: minmax(140px, 1fr) minmax(220px, 2fr); gap: 16px; margin-bottom: 18px; }
    .artist-controls label { display: block; margin-bottom: 6px; font-weight: 700; }
    .artist-controls input { width: 100%; min-height: 46px; padding: 8px 12px; border: 1px solid #dcb656; border-radius: 8px; color: #fff; background: #342814; font: inherit; }
    .artist-controls input:focus-visible, .artist-controls select:focus-visible, .artists-results button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .artists-results { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-content: start; gap: 7px; }
    .artists-results button { display: flex; align-items: center; justify-content: space-between; gap: 9px; min-height: 42px; padding: 7px 10px; border: 1px solid #a8873d; border-radius: 7px; color: #fff4d1; background: #342814; text-align: left; font: inherit; font-size: 14px; }
    .artists-results button:nth-child(even) { background: #49351d; }
    .artists-results button:hover { background: #705024; }
    .artists-results button strong { flex: none; color: #f7dc82; }
    .track-dialog { width: min(740px, 100%); }
    .track-search-label { display: block; margin-bottom: 6px; font-weight: 700; }
    .track-search-input { width: 100%; min-height: 46px; padding: 8px 12px; border: 1px solid #dcb656; border-radius: 8px; color: #fff; background: #342814; font: inherit; }
    .track-search-input:focus-visible, .track-search-results button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .track-search-results { display: grid; gap: 8px; margin-top: 16px; }
    .track-search-results > p { margin: 4px 0; }
    .track-search-results button { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 58px; padding: 9px 13px; border: 1px solid #a8873d; border-radius: 8px; color: #fff4d1; background: #342814; text-align: left; font: inherit; }
    .track-search-results button:nth-child(even) { background: #49351d; }
    .track-search-results button:hover { background: #705024; }
    .track-search-results button span { min-width: 0; }
    .track-search-results button small { display: block; margin-top: 3px; }
    .track-artist-code { flex: none; color: #f7dc82; }
    @media (max-width: 800px) {
        .artists-results { grid-template-columns: 1fr; }
        .artist-controls { grid-template-columns: 1fr; }
    }
    @media (max-width: 800px) {
        .collections-desktop-groups { display: none; }
        .collections-mobile-groups { display: block; }
    }
    @media (max-width: 600px) { .browser-backdrop { padding: 12px; } .browser-dialog { max-height: calc(100vh - 24px); padding: 18px; } }

    @media (max-width: 820px) {
        .journey {
            height: calc(100vh - 62px);
            min-height: 560px;
        }

        .journey-art, .shade, .choice-layer {
            width: max(100%, calc((100vh - 62px) * 1.77683));
        }

        .journey-title {
            top: 12%;
        }

        .journey-title h1 {
            font-size: clamp(24px, 6vw, 36px);
        }

        .choice-label small {
            display: none;
        }

        .choice-label {
            padding: 8px 5px;
        }

        .mode-button {
            bottom: 2%;
            padding: 11px 24px;
            font-size: 17px;
        }
    }

    .mobile-page {
    min-height: calc(100vh - 62px);
    padding: 76px 18px 32px;
    background:
        radial-gradient(circle at 25% 15%, #4b2f13, transparent 38%),
        #100d09;
}

.mobile-card {
    width: min(680px, 100%);
    margin: 0 auto;
    padding: clamp(24px, 5vw, 42px);
    color: #fff;
    background: rgba(18, 16, 13, 0.97);
    border: 1px solid rgba(214, 193, 122, 0.42);
    border-radius: 26px;
    text-align: center;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
}

.mobile-logo {
    width: 58px;
    height: 58px;
    border-radius: 12px;
}

.mobile-card h1 {
    margin: 18px 0 8px;
    color: #f7dc82;
    font-size: clamp(28px, 7vw, 44px);
    line-height: 1.08;
}

.mobile-card > p {
    margin: 0;
    color: #fff4d1;
    font-size: 17px;
    line-height: 1.4;
}

.mobile-program-list {
    display: grid;
    gap: 12px;
    margin-top: 26px;
}

.mobile-program-list .mobile-browse {
    min-height: 78px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    color: #fff;
    background: #24211d;
    border: 2px solid #625735;
    border-radius: 15px;
    text-align: left;
}

.mobile-choice { display: grid; gap: 6px; }

.mobile-program-route {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 46px;
    margin-top: 4px;
    padding: 9px 14px;
    color: #1e1608;
    background: #f7dc82;
    border: 1px solid #fff0b0;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 800;
}
.mobile-program-route:hover, .mobile-program-route:focus-visible { background: #ffe9a5; outline: 3px solid #fff; outline-offset: 2px; }

.catalog-entry-mobile {
    position: relative;
    margin-top: 4px;
    padding: 14px;
    text-align: left;
}

.mobile-program-list .mobile-browse:hover,
.mobile-program-list .mobile-browse:focus-visible {
    background: #332d23;
    border-color: #f7dc82;
    outline: none;
}


.mobile-choice-text strong,
.mobile-choice-text small {
    display: block;
}

.mobile-choice-text strong {
    font-size: 19px;
}

.mobile-choice-text small {
    margin-top: 5px;
    font-size: 14px;
    line-height: 1.3;
}

@media (max-width: 480px) {
    .mobile-page {
        padding: 72px 12px 24px;
    }

    .mobile-card {
        padding: 22px 16px;
        border-radius: 20px;
    }
}
</style>
