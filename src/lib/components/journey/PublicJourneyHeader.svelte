<script lang="ts">
    import {onMount, tick} from 'svelte';
    import { getBackendUrl } from '$lib/config';
    import ContactModal from '$lib/components/profile-components/ContactModal.svelte';

    export let language: 'en' | 'es' | 'ptbr' = 'en';
    export let preferencesHref = '/playback-preferences';
    export let onPreferences: (() => void) | undefined = undefined;

    type HeaderUser = {
        display_name?: string | null;
        app_avatar_url?: string | null;
        spotify_profile_image?: string | null;
    };

    let user: HeaderUser | null = null;
    let authChecked = false;

    let aboutMenuOpen = false;
    let myMenuOpen = false;
    let mobileMenuOpen = false;
    let showContactModal = false;
    let aboutMenu: HTMLElement;
    let myMenu: HTMLElement;
    let mobileMenu: HTMLElement;
    let mobileMenuTrigger: HTMLButtonElement;

    const text = {
        en: {
            home: 'TopSpot40 home',
            navigation: 'TopSpot40 navigation',
            about: 'About',
            discover: 'Discover TopSpot40',
            aboutTopSpot40: 'About TopSpot40',
            contact: 'Contact Us',
            signIn: 'Sign In',
            signUp: 'Sign Up',
            myTopSpot40: 'My TopSpot40',
            progress: 'My Music Journey',
            preferences: 'Playback Preferences',
            dashboard: 'Dashboard',
            menu: 'Menu'
        },
        es: {
            home: 'Inicio de TopSpot40',
            navigation: 'Navegación de TopSpot40',
            about: 'Acerca de',
            discover: 'Descubrir TopSpot40',
            aboutTopSpot40: 'Acerca de TopSpot40',
            contact: 'Contáctanos',
            signIn: 'Iniciar sesión',
            signUp: 'Registrarse',
            myTopSpot40: 'Mi TopSpot40',
            progress: 'Progreso de escucha',
            preferences: 'Preferencias de reproducción',
            dashboard: 'Panel',
            menu: 'Menú'
        },
        ptbr: {
            home: 'Início do TopSpot40',
            navigation: 'Navegação do TopSpot40',
            about: 'Sobre',
            discover: 'Descobrir TopSpot40',
            aboutTopSpot40: 'Sobre o TopSpot40',
            contact: 'Fale conosco',
            signIn: 'Entrar',
            signUp: 'Cadastrar',
            myTopSpot40: 'Meu TopSpot40',
            progress: 'Progresso de escuta',
            preferences: 'Preferências de reprodução',
            dashboard: 'Painel',
            menu: 'Menu'
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

        if (mobileMenu && !mobileMenu.contains(target)) {
            mobileMenuOpen = false;
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

    async function handleDocumentKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape' || !mobileMenuOpen) return;

        mobileMenuOpen = false;
        await tick();
        mobileMenuTrigger?.focus();
    }

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
        aboutMenuOpen = false;
        myMenuOpen = false;
    }

    function openContactModal() {
        aboutMenuOpen = false;
        mobileMenuOpen = false;
        showContactModal = true;
    }

    function handlePreferencesClick(event: MouseEvent): void {
        if (!onPreferences) return;

        event.preventDefault();
        onPreferences();
    }

async function loadAuthenticatedUser() {
    try {
        const response = await fetch(
            `${getBackendUrl()}/api/auth/me`,
            {
                credentials: 'include'
            }
        );

        if (response.ok) {
            user = (await response.json()) as HeaderUser;
        }
    } catch {
        user = null;
    } finally {
        authChecked = true;
    }
}

    onMount(() => {
        void loadAuthenticatedUser();
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleDocumentKeydown);

        return () => {
            document.removeEventListener('click', handleDocumentClick);
            document.removeEventListener('keydown', handleDocumentKeydown);
        };
    });
</script>

<header class="topbar">
    <a class="brand" href="/" aria-label={text[language].home}>
        <img src="/old-dog-icon.png" alt=""/>
        <span>TopSpot<span class="brand-number">40</span></span>
    </a>

    <nav class="desktop-nav" aria-label={text[language].navigation}>
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
                    <a role="menuitem" href="/music-journey">
                        {text[language].progress}
                    </a>
                    <a
                            role="menuitem"
                            href={preferencesHref}
                            on:click={handlePreferencesClick}
                    >
                        {text[language].preferences}
                    </a>
                </div>
            {/if}
        </div>

        {#if authChecked}
            {#if user}
                <a class="secondary-link signin" href="/dashboard">
                    {text[language].dashboard}
                </a>

                <a
                    class="profile-link"
                    href="/dashboard"
                    aria-label={text[language].dashboard}
                >
                    <img
                        src={user.app_avatar_url ||
                            user.spotify_profile_image ||
                            '/old-dog-icon.png'}
                        alt=""
                    />
                </a>
            {:else}
                <a class="secondary-link signin" href="/signin">
                    {text[language].signIn}
                </a>
                <a class="signup" href="/signup-official">
                    {text[language].signUp}
                </a>
            {/if}
        {/if}
    </nav>

    <div class="mobile-menu" bind:this={mobileMenu}>
        <button
                class="mobile-menu-trigger"
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-journey-navigation"
                bind:this={mobileMenuTrigger}
                on:click|stopPropagation={toggleMobileMenu}
        >
            {text[language].menu}
            <span aria-hidden="true">☰</span>
        </button>

        {#if mobileMenuOpen}
            <nav id="mobile-journey-navigation" class="mobile-menu-panel" aria-label={text[language].navigation}>
                <div class="mobile-primary-actions">
                    <details>
                        <summary>{text[language].about}</summary>
                        <a href="/catalog/index.html">{text[language].discover}</a>
                        <a href="/about">{text[language].aboutTopSpot40}</a>
                        <button type="button" on:click={openContactModal}>{text[language].contact}</button>
                    </details>

                    <details>
                        <summary>{text[language].myTopSpot40}</summary>
                        <a href="/music-journey">{text[language].progress}</a>
                        <a href={preferencesHref} on:click={handlePreferencesClick}>{text[language].preferences}</a>
                    </details>

                    {#if authChecked}
                        {#if user}
                            <a class="mobile-account-link" href="/dashboard">{text[language].dashboard}</a>
                        {:else}
                            <div class="mobile-account-actions">
                                <a class="mobile-signin" href="/signin">{text[language].signIn}</a>
                                <a class="mobile-signup" href="/signup-official">{text[language].signUp}</a>
                            </div>
                        {/if}
                    {/if}
                </div>
            </nav>
        {/if}
    </div>
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

    nav .signin {
        padding: 9px 14px;
        border: 1px solid rgba(245, 214, 110, 0.55);
        border-radius: 10px;
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

    .profile-link {
        display: inline-flex;
        width: 42px;
        height: 42px;
        padding: 0;
        overflow: hidden;
        align-items: center;
        justify-content: center;
        border: 2px solid #1db954;
        border-radius: 50%;
        background: #101010;
    }

    .profile-link img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .mobile-menu {
        display: none;
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
        .topbar {
            min-height: 58px;
            gap: 12px;
            padding: 8px 14px;
        }

        .brand {
            min-width: 0;
            font-size: 20px;
        }

        .brand img {
            width: 36px;
            height: 36px;
        }

        .desktop-nav {
            display: none;
        }

        .mobile-menu {
            position: relative;
            display: block;
            flex: 0 0 auto;
        }

        .mobile-menu-trigger {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 42px;
            padding: 8px 12px;
            color: #fff;
            background: #171717;
            border: 1px solid rgba(245, 214, 110, 0.7);
            border-radius: 10px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
        }

        .mobile-menu-trigger:hover,
        .mobile-menu-trigger:focus-visible {
            color: #f5d66e;
            outline: 3px solid #fff;
            outline-offset: 3px;
        }

        .mobile-menu-panel {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            position: absolute;
            z-index: 50;
            top: calc(100% + 8px);
            right: 0;
            width: min(320px, calc(100vw - 28px));
            padding: 8px;
            box-sizing: border-box;
            background: #171717;
            border: 1px solid rgba(245, 214, 110, 0.7);
            border-radius: 12px;
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.62);
        }

        .mobile-primary-actions,
        .mobile-account-actions {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
        }

        .mobile-primary-actions {
            width: 100%;
        }

        .mobile-menu-panel details {
            border-bottom: 1px solid rgba(245, 214, 110, 0.24);
        }

        .mobile-menu-panel summary,
        .mobile-menu-panel a,
        .mobile-menu-panel button {
            display: block;
            width: 100%;
            max-width: 100%;
            min-height: 44px;
            padding: 11px 12px;
            box-sizing: border-box;
            color: #fff;
            background: transparent;
            border: 0;
            border-radius: 8px;
            font: inherit;
            text-align: left;
            text-decoration: none;
            cursor: pointer;
            white-space: normal;
            overflow-wrap: anywhere;
        }

        .mobile-menu-panel summary {
            color: #f5d66e;
            font-weight: 800;
            list-style-position: inside;
        }

        .mobile-menu-panel a:hover,
        .mobile-menu-panel a:focus-visible,
        .mobile-menu-panel button:hover,
        .mobile-menu-panel button:focus-visible,
        .mobile-menu-panel summary:focus-visible {
            color: #0d180d;
            background: #75ef4f;
            outline: 3px solid #fff;
            outline-offset: 2px;
        }

        .mobile-account-actions { padding-top: 8px; }

        .mobile-menu-panel .mobile-signin,
        .mobile-menu-panel .mobile-signup,
        .mobile-menu-panel .mobile-account-link {
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-weight: 800;
        }

        .mobile-menu-panel .mobile-signin {
            border: 1px solid rgba(245, 214, 110, 0.7);
        }

        .mobile-menu-panel .mobile-signup {
            color: #f5d66e;
            border: 2px solid #d9aa28;
        }

        .mobile-menu-panel .mobile-account-link {
            margin-top: 8px;
            color: #f5d66e;
            border: 1px solid rgba(245, 214, 110, 0.7);
        }
    }

</style>
