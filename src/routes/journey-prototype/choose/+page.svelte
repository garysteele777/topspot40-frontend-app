<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import posthog from 'posthog-js';
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import {readStoredLanguagePreference} from '$lib/languagePreferences';
    import {captureExperienceSelected} from '$lib/analytics/posthog';
    import {buildExperienceDestination, EXPERIENCE_FAMILIES, type ExperienceFamily, type ExperienceMode} from '$lib/journey/experienceMode';
    import {lookupProgramCode, ProgramCodeLookupError, programCodeUrl} from '$lib/api/programCode.js';

    type LandingLanguage = 'en' | 'es' | 'ptbr';
    let language: LandingLanguage = 'en';
    let selectedProgram: ExperienceFamily | null = null;
    let showJourneyLayout = false;
    let catalogDigits = '';
    let catalogStatus: string | null = null;
    let catalogStatusKind: 'error' | 'status' | null = null;
    let lookingUpCatalog = false;
    let catalogDestination: string | null = null;
    let catalogLookupVersion = 0;
    let catalogLookupTimer: ReturnType<typeof setTimeout> | null = null;

    const text = {
        en: {
            title: 'Choose Your TopSpot40 Experience',
            instruction: 'Choose the program journey you would like to explore.',
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
            title: 'Elige tu experiencia TopSpot40', instruction: 'Elige el programa musical que deseas explorar.',
            continue: 'Continuar', back: 'Atrás', home: 'Inicio',
            nostalgia: 'Programas de Nostalgia', nostalgiaDesc: 'Música por década y género',
            collections: 'Programas de Colecciones', collectionsDesc: 'Temas musicales seleccionados',
            artist: 'Artistas Destacados', artistDesc: 'Música e historias de artistas legendarios',
            docuseries: 'Docuseries Musicales', docuseriesDesc: 'Historia musical en series documentales'
        },
        ptbr: {
            title: 'Escolha sua experiência TopSpot40', instruction: 'Escolha o programa musical que deseja explorar.',
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

    const catalogCopy: Record<LandingLanguage, {
        label: string; go: string; checking: string; reveal: string;
        notFound: string; wrongExperience: string; unavailable: string;
    }> = {
        en: {
            label: 'Catalog Number', go: 'Go', checking: 'Checking number…', reveal: 'Enter catalog number',
            notFound: 'We couldn’t find that catalog number. Please check the catalog and try again.',
            wrongExperience: 'That number belongs to a different TopSpot40 experience.',
            unavailable: 'That program cannot be opened because its catalog details are incomplete.'
        },
        es: {
            label: 'Número de catálogo', go: 'Ir', checking: 'Comprobando número…', reveal: 'Ingresar número de catálogo',
            notFound: 'No pudimos encontrar ese número de catálogo. Revise el catálogo e inténtelo de nuevo.',
            wrongExperience: 'Ese número pertenece a una experiencia TopSpot40 diferente.',
            unavailable: 'Ese programa no se puede abrir porque sus detalles de catálogo están incompletos.'
        },
        ptbr: {
            label: 'Número do catálogo', go: 'Ir', checking: 'Verificando número…', reveal: 'Digitar número do catálogo',
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
        };
    });
</script>

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
                        <button class="mobile-browse" on:click={() => goto(buildExperienceDestination(choice, 'program'))}>
                        <span class="mobile-choice-text">
                            <strong>{text[language][choice]}</strong>
                            <small>{description(choice)}</small>
                        </span>
                            <span aria-hidden="true">
                            {selectedProgram === choice ? '✓' : '→'}
                        </span>
                        </button>
                        <button class="reveal-catalog" type="button" on:click={() => setProgram(choice)}>{catalogText().reveal}</button>
                        </div>
                    {/each}
                </div>
                {#if selectedProgram}
                    <form class="catalog-entry catalog-entry-mobile" on:submit|preventDefault={goToCatalogProgram}>
                        <label for="mobile-catalog-digits">{catalogText().label}</label>
                        <div class="catalog-row">
                            <span class="catalog-prefix" aria-hidden="true">{catalogPrefixes[selectedProgram]}</span>
                            <input id="mobile-catalog-digits" value={catalogDigits} on:input={updateCatalogDigits} inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="mobile-catalog-status" />
                            <button type="submit" disabled={!catalogDestination || lookingUpCatalog}>{catalogText().go}</button>
                        </div>
                        <div id="mobile-catalog-status" class:catalog-error={catalogStatusKind === 'error'} role={catalogStatusKind === 'error' ? 'alert' : 'status'} aria-live="polite">{lookingUpCatalog ? catalogText().checking : catalogStatus ?? ''}</div>
                    </form>
                {/if}
            </section>
        </main>
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
    .catalog-row input:focus-visible, .catalog-row button:focus-visible, .reveal-catalog:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .catalog-row button:disabled { cursor: wait; opacity: .6; }
    .catalog-entry [role] { min-height: 1.2em; margin-top: 5px; font-size: 12px; }
    .catalog-entry .catalog-error { color: #ffb4a9; }

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

.mobile-program-list button {
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

.mobile-program-list .reveal-catalog {
    min-height: 38px;
    padding: 8px 12px;
    color: #f7dc82;
    background: transparent;
    border: 1px solid #625735;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
}

.mobile-program-list .reveal-catalog:hover { border-color: #f7dc82; background: #332d23; }

.catalog-entry-mobile {
    position: relative;
    margin-top: 20px;
    padding: 14px;
    text-align: left;
}

.mobile-program-list button:hover,
.mobile-program-list button:focus-visible {
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
