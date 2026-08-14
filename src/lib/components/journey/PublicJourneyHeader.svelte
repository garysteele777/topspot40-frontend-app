<script lang="ts">
    import {onMount} from 'svelte';
    import ContactModal from '$lib/components/profile-components/ContactModal.svelte';

    export let language: 'en' | 'es' | 'ptbr' = 'en';

    let aboutMenuOpen = false;
    let myMenuOpen = false;
    let showContactModal = false;
    let aboutMenu: HTMLElement;
    let myMenu: HTMLElement;

    const text = {
        en: {
            about: 'About',
            discover: 'Discover TopSpot40',
            aboutTopSpot40: 'About TopSpot40',
            contact: 'Contact Us',
            signIn: 'Sign In',
            signUp: 'Sign Up',
            myTopSpot40: 'My TopSpot40',
            progress: 'Listening Progress',
            preferences: 'Playback Preferences'
        },
        es: {
            about: 'Acerca de',
            discover: 'Descubrir TopSpot40',
            aboutTopSpot40: 'Acerca de TopSpot40',
            contact: 'Contáctanos',
            signIn: 'Iniciar sesión',
            signUp: 'Registrarse',
            myTopSpot40: 'Mi TopSpot40',
            progress: 'Progreso de escucha',
            preferences: 'Preferencias de reproducción'
        },
        ptbr: {
            about: 'Sobre',
            discover: 'Descobrir TopSpot40',
            aboutTopSpot40: 'Sobre o TopSpot40',
            contact: 'Fale conosco',
            signIn: 'Entrar',
            signUp: 'Cadastrar',
            myTopSpot40: 'Meu TopSpot40',
            progress: 'Progresso de escuta',
            preferences: 'Preferências de reprodução'
        }
    };

    function handleDocumentClick(event: MouseEvent) {
        const target = event.target as Node;

        if (aboutMenu && !aboutMenu.contains(target)) {
            aboutMenuOpen = false;
        }

        if (myMenu && !myMenu.contains(target)) {
            myMenuOpen = false;
        }
    }

    function toggleAboutMenu() {
        aboutMenuOpen = !aboutMenuOpen;
        myMenuOpen = false;
    }

    function toggleMyMenu() {
        myMenuOpen = !myMenuOpen;
        aboutMenuOpen = false;
    }

    function openContactModal() {
        aboutMenuOpen = false;
        showContactModal = true;
    }

    onMount(() => {
        document.addEventListener('click', handleDocumentClick);

        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    });
</script>

<header class="topbar">
    <a class="brand" href="/" aria-label="TopSpot40 home">
        <img src="/old-dog-icon.png" alt=""/>
        <span>TopSpot<span class="brand-number">40</span></span>
    </a>

    <nav aria-label="TopSpot40 navigation">
        <div class="my-menu" bind:this={aboutMenu}>
            <button
                class="my-menu-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={aboutMenuOpen}
                on:click|stopPropagation={toggleAboutMenu}
            >
                {text[language].about}
                <span aria-hidden="true">▾</span>
            </button>

            {#if aboutMenuOpen}
                <div class="my-menu-panel" role="menu">
                    <a role="menuitem" href="/catalog/index.html">
                        {text[language].discover}
                    </a>
                    <a role="menuitem" href="/about">
                        {text[language].aboutTopSpot40}
                    </a>
                    <button
                        class="menu-action"
                        role="menuitem"
                        type="button"
                        on:click={openContactModal}
                    >
                        {text[language].contact}
                    </button>
                </div>
            {/if}
        </div>

        <div class="my-menu" bind:this={myMenu}>
            <button
                class="my-menu-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={myMenuOpen}
                on:click|stopPropagation={toggleMyMenu}
            >
                {text[language].myTopSpot40}
                <span aria-hidden="true">▾</span>
            </button>

            {#if myMenuOpen}
                <div class="my-menu-panel" role="menu">
                    <a role="menuitem" href="/options-v4?panel=journey">
                        {text[language].progress}
                    </a>
                    <a role="menuitem" href="/options-v4?panel=preferences">
                        {text[language].preferences}
                    </a>
                </div>
            {/if}
        </div>

        <a class="secondary-link" href="/signin">{text[language].signIn}</a>
        <a class="signup" href="/signup-official">{text[language].signUp}</a>
    </nav>
</header>

<div class="contact-modal-host">
    <ContactModal
        visible={showContactModal}
        onClose={() => (showContactModal = false)}
    />
</div>

<style>
    .topbar {
        position: relative;
        z-index: 40;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 10px clamp(18px, 4vw, 64px);
        background: rgba(5, 5, 5, 0.96);
        border-bottom: 1px solid rgba(214, 193, 122, 0.38);
        color: #fff;
        font-family: Arial, sans-serif;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #f5d66e;
        font-size: clamp(22px, 2vw, 32px);
        font-weight: 900;
        text-decoration: none;
    }

    .brand img {
        width: 46px;
        height: 46px;
        border-radius: 10px;
        object-fit: contain;
    }

    .brand-number {
        color: #e54a2e;
    }

    nav {
        display: flex;
        align-items: center;
        gap: clamp(12px, 2vw, 30px);
    }

    nav a,
    .my-menu-trigger {
        color: #fff;
        background: none;
        border: 0;
        text-decoration: none;
        white-space: nowrap;
        font: inherit;
        cursor: pointer;
    }

    nav a:hover,
    nav a:focus-visible,
    .my-menu-trigger:hover,
    .my-menu-trigger:focus-visible {
        color: #f5d66e;
    }

    nav .signup {
        padding: 10px 22px;
        color: #f5d66e;
        border: 2px solid #d9aa28;
        border-radius: 12px;
    }

    .my-menu {
        position: relative;
    }

    .my-menu-trigger {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 9px 12px;
        border: 1px solid rgba(245, 214, 110, 0.55);
        border-radius: 10px;
    }

    .my-menu-panel {
        position: absolute;
        top: calc(100% + 9px);
        right: 0;
        width: max-content;
        min-width: 220px;
        padding: 7px;
        background: #171717;
        border: 1px solid rgba(245, 214, 110, 0.55);
        border-radius: 12px;
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.62);
    }

    .my-menu-panel a {
        display: block;
        padding: 11px 13px;
        border-radius: 8px;
    }

    .menu-action {
        display: block;
        width: 100%;
        padding: 11px 13px;
        color: #fff;
        background: transparent;
        border: 0;
        border-radius: 8px;
        text-align: left;
        font: inherit;
        cursor: pointer;
    }

    .my-menu-panel a:hover,
    .my-menu-panel a:focus-visible,
    .menu-action:hover,
    .menu-action:focus-visible {
        color: #0d180d;
        background: #75ef4f;
        outline: none;
    }

    .contact-modal-host {
        position: relative;
        z-index: 10000;
    }

    @media (max-width: 820px) {
        .topbar {
            min-height: 62px;
            padding: 8px 14px;
        }

        .brand {
            font-size: 22px;
        }

        .brand img {
            width: 38px;
            height: 38px;
        }

        .secondary-link {
            display: none;
        }

        nav {
            gap: 8px;
        }

        nav .signup {
            padding: 8px 10px;
        }

        .my-menu-trigger {
            padding: 8px 9px;
        }

        .my-menu-panel {
            right: -52px;
        }
    }

    @media (max-width: 600px) {
    .brand > span {
        display: none;
    }
}

    @media (max-width: 480px) {
        nav .signup {
            display: none;
        }
    }
</style>
