<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import {createSingleChoiceContinue} from '$lib/interactions/singleChoiceContinue.js';

    type LandingLanguage = 'en' | 'es' | 'ptbr';
    type ProgramChoice = 'nostalgia' | 'collections' | 'artist';

    let language: LandingLanguage = 'en';
    let selectedProgram: ProgramChoice | null = null;

    const text = {
        en: {
            title: 'Welcome to the TopSpot40 Listening Library',
            instruction: 'Choose the musical journey you would like to explore.',
            continue: 'Continue',
            back: 'Back',
            home: 'Home',
            contact: 'Contact Us',
            about: 'About',
            signIn: 'Sign In',
            signUp: 'Sign Up',
            nostalgia: 'Nostalgia Programs',
            nostalgiaDesc: 'Music by decade and genre',
            collections: 'Collections Programs',
            collectionsDesc: 'Curated musical themes',
            artist: 'Artist Spotlight',
            artistDesc: 'Music and stories of legendary artists'
        },
        es: {
            title: 'Bienvenido a la Biblioteca Musical TopSpot40',
            instruction: 'Elige el viaje musical que deseas explorar.',
            continue: 'Continuar',
            back: 'Atrás',
            home: 'Inicio',
            contact: 'Contáctanos',
            about: 'Acerca de',
            signIn: 'Iniciar sesión',
            signUp: 'Registrarse',
            nostalgia: 'Programas de Nostalgia',
            nostalgiaDesc: 'Música por década y género',
            collections: 'Programas de Colecciones',
            collectionsDesc: 'Temas musicales seleccionados',
            artist: 'Artista Destacado',
            artistDesc: 'Música e historias de artistas legendarios'
        },
        ptbr: {
            title: 'Bem-vindo à Biblioteca Musical TopSpot40',
            instruction: 'Escolha a jornada musical que deseja explorar.',
            continue: 'Continuar',
            back: 'Voltar',
            home: 'Início',
            contact: 'Fale conosco',
            about: 'Sobre',
            signIn: 'Entrar',
            signUp: 'Cadastrar',
            nostalgia: 'Programas de Nostalgia',
            nostalgiaDesc: 'Música por década e gênero',
            collections: 'Programas de Coleções',
            collectionsDesc: 'Temas musicais selecionados',
            artist: 'Destaque de Artista',
            artistDesc: 'Música e histórias de artistas lendários'
        }
    };

    const routes: Record<ProgramChoice, string> = {
        nostalgia: '/journey-prototype/decade',
        collections: '/options-v4?panel=library&tab=collections',
        artist: '/options-v4?panel=library&tab=artist'
    };

    const choices: ProgramChoice[] = ['nostalgia', 'collections', 'artist'];

    function setProgram(choice: ProgramChoice) {
        selectedProgram = choice;
        localStorage.setItem('topspot_journey_program', choice);
    }

    function programDescription(choice: ProgramChoice) {
        if (choice === 'nostalgia') return text[language].nostalgiaDesc;
        if (choice === 'collections') return text[language].collectionsDesc;
        return text[language].artistDesc;
    }

    function performContinueJourney() {
        if (selectedProgram) {
            goto(routes[selectedProgram]);
        }
    }

    const selectionContinue = createSingleChoiceContinue({
        getSelected: () => selectedProgram,
        select: setProgram,
        onContinue: performContinueJourney,
        isContinueDisabled: () => !selectedProgram
    });

    function chooseProgram(choice: ProgramChoice, event?: MouseEvent) {
        selectionContinue.select(choice, event);
    }

    function continueJourney() {
        return selectionContinue.continue();
    }

    onMount(() => {
        const savedLanguage = localStorage.getItem('topspot_language');
        if (savedLanguage === 'en' || savedLanguage === 'es' || savedLanguage === 'ptbr') {
            language = savedLanguage;
        }
    });
</script>

<svelte:head>
    <title>{text[language].title}</title>
    <meta
            name="description"
            content="Choose a Nostalgia, Collections, or Artist Spotlight program."
    />
</svelte:head>

<div class="prototype">
    <PublicJourneyHeader {language}/>

    <main class="journey">
        <img
                class="journey-art"
                src="/images/journey/grand-music-library.png"
                alt="A grand music library with three illuminated program wings"
        />
        <div class="shade" aria-hidden="true"></div>

        <div class="utilitybar">
            <a class="utility" href="/journey-prototype/choose">
                <span aria-hidden="true">←</span>
                {text[language].back}
            </a>
            <a class="utility" href="/">
                <span aria-hidden="true">⌂</span>
                {text[language].home}
            </a>
        </div>

        <section class="journey-title">
            <h1>{text[language].title}</h1>
            <p>{text[language].instruction}</p>
        </section>

        <div class="choice-layer">
            {#each choices as choice}
                <button
                        class="program-choice program-{choice}"
                        class:active={selectedProgram === choice}
                        aria-pressed={selectedProgram === choice}
                        on:click={(event) => chooseProgram(choice, event)}
                >
                    <span class="choice-label">
                        <strong>{text[language][choice]}</strong>
                        <small>{programDescription(choice)}</small>
                    </span>
                </button>
            {/each}
        </div>

        {#if selectedProgram}
            <button class="continue" on:click={continueJourney}>
                {text[language].continue}
                <span aria-hidden="true">→</span>
            </button>
        {/if}
    </main>
</div>

<style>
    :global(html),
    :global(body) {
        margin: 0;
        min-height: 100%;
        background: #090705;
        color: #fff;
        font-family: Arial, sans-serif;
    }

    :global(*) {
        box-sizing: border-box;
    }

    button,
    a {
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

    .journey-art,
    .shade,
    .choice-layer {
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, calc((100vh - 72px) * 1.77778));
        aspect-ratio: 16 / 9;
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
        background: linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.42),
                transparent 27%,
                transparent 70%,
                rgba(0, 0, 0, 0.52)
        );
    }

    .utilitybar {
        position: absolute;
        z-index: 10;
        top: 20px;
        left: 3%;
        display: flex;
        gap: 12px;
    }

    .utility {
        padding: 10px 16px;
        color: #fff;
        background: rgba(8, 6, 3, 0.78);
        border: 1px solid rgba(235, 193, 83, 0.62);
        border-radius: 14px;
        text-decoration: none;
        font-weight: 700;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.55);
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

    .program-choice {
        position: absolute;
        top: 21%;
        width: 25%;
        height: 55%;
        padding: 0;
        border: 3px solid transparent;
        border-radius: 40% 40% 18px 18px;
        background: transparent;
        pointer-events: auto;
        transition: border-color 160ms ease,
        box-shadow 160ms ease,
        background 160ms ease;
    }

    .program-nostalgia {
        left: 6.5%;
    }

    .program-collections {
        left: 37.5%;
    }

    .program-artist {
        left: 67%;
        width: 24%;
    }

    .program-choice:hover,
    .program-choice:focus-visible,
    .program-choice.active {
        outline: none;
        border-color: #74ff4f;
        background: rgba(22, 155, 67, 0.08);
        box-shadow: 0 0 18px #55ff3c,
        0 0 48px rgba(55, 255, 56, 0.58),
        inset 0 0 40px rgba(55, 255, 56, 0.14);
    }

    .choice-label {
        position: absolute;
        left: 50%;
        bottom: 4%;
        width: min(92%, 340px);
        transform: translateX(-50%);
        padding: 12px 16px;
        color: #f6dc8a;
        background: rgba(8, 5, 2, 0.9);
        border: 2px solid rgba(226, 177, 62, 0.82);
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 5px 18px rgba(0, 0, 0, 0.72);
    }

    .choice-label strong,
    .choice-label small {
        display: block;
    }

    .choice-label strong {
        font-family: Georgia, serif;
        font-size: clamp(17px, 1.45vw, 25px);
    }

    .choice-label small {
        margin-top: 5px;
        color: #fff4d1;
        font-size: clamp(12px, 0.9vw, 15px);
    }

    .continue {
        position: absolute;
        z-index: 12;
        left: 50%;
        bottom: 2.5%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 30px;
        color: #081008;
        background: #75ef4f;
        border: 2px solid #b7ff9c;
        border-radius: 999px;
        font-size: 20px;
        font-weight: 900;
        box-shadow: 0 0 28px rgba(78, 255, 73, 0.62);
    }

    @media (max-width: 820px) {

        .journey {
            height: calc(100vh - 62px);
            min-height: 560px;
        }

        .journey-art,
        .shade,
        .choice-layer {
            width: max(100%, calc((100vh - 62px) * 1.77778));
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
            padding: 8px;
        }

        .continue {
            bottom: 2%;
            padding: 11px 24px;
            font-size: 17px;
        }
    }
</style>
