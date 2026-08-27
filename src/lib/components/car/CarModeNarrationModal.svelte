<script lang="ts">
    import {onMount, tick} from 'svelte';
    import {fade, fly} from 'svelte/transition';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';

    type InfoMode = 'intro' | 'detail' | 'artist';

    export let track: CarModeTrack | null = null;
    export let open = false;
    export let onClose: () => void;
    export let languages: string[] = ['en'];
    export let initialMode: InfoMode = 'intro';

    /* ──────────────────────────────
       Swipe / drag physics
       ────────────────────────────── */
    let startY = 0;
    let currentY = 0;
    let translateY = 0;
    let isDragging = false;

    let modalEl: HTMLDivElement | null = null;
    let closeButton: HTMLButtonElement | null = null;
    let previouslyFocusedElement: HTMLElement | null = null;
    let wasOpen = false;

    function getFocusableElements(): HTMLElement[] {
        return modalEl
            ? Array.from(
                modalEl.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            )
            : [];
    }

    function trapFocus(event: KeyboardEvent): void {
        const focusable = getFocusableElements();

        if (!focusable.length) {
            event.preventDefault();
            modalEl?.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!open) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        } else if (event.key === 'Tab') {
            trapFocus(event);
        }
    }

    async function focusModal(): Promise<void> {
        await tick();
        if (open) closeButton?.focus();
    }

    async function restoreFocus(): Promise<void> {
        await tick();
        if (!open && previouslyFocusedElement?.isConnected) {
            previouslyFocusedElement.focus();
        }
        previouslyFocusedElement = null;
    }

    $: if (open && !wasOpen) {
        wasOpen = true;
        previouslyFocusedElement =
            typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        void focusModal();
    } else if (!open && wasOpen) {
        wasOpen = false;
        void restoreFocus();
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    });

    /* ──────────────────────────────
       Parallax state
       ────────────────────────────── */
    let scrollY = 0;

    function handleScroll() {
        if (!modalEl) return;
        scrollY = modalEl.scrollTop;
    }

    function onTouchStart(e: TouchEvent) {
        isDragging = true;
        startY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        translateY = Math.max(0, currentY - startY);
        modalEl?.style.setProperty(
            'transform',
            `translateX(-50%) translateY(${translateY}px)`
        );
    }

    function onTouchEnd() {
        if (!isDragging) return;
        isDragging = false;

        if (translateY > 120) {
            onClose();
        } else {
            if (modalEl) {
                modalEl.style.transition = 'transform 0.25s ease-out';
                modalEl.style.transform = 'translateX(-50%) translateY(0)';
                setTimeout(() => {
                    if (modalEl) modalEl.style.transition = '';
                }, 260);
            }
        }
        translateY = 0;
    }

    /* ──────────────────────────────
       Info navigation (Intro / Detail / Artist)
       ────────────────────────────── */
    type LanguageTexts = {
        intro?: string | null;
        detail?: string | null;
        artist?: string | null;
    };

    type TextsByLanguage = Record<string, LanguageTexts>;
    let mode: InfoMode = 'intro';

    // Reset whenever modal opens
    $: if (open) {
        mode = initialMode;
    }

    $: headerImage =
        track?.artistArtwork ??
        track?.albumArtwork ??
        null;


    function prevMode() {
        mode =
            mode === 'intro' ? 'artist' :
                mode === 'detail' ? 'intro' :
                    'detail';
    }

    function nextMode() {
        mode =
            mode === 'intro' ? 'detail' :
                mode === 'detail' ? 'artist' :
                    'intro';
    }

    $: headerLabel =
        mode === 'intro' ? 'Intro' :
            mode === 'detail' ? 'Detail' :
                'Artist';

    $: textsByLanguage =
        ((track as typeof track & {
            textsByLanguage?: TextsByLanguage;
        })?.textsByLanguage) ?? {};

    $: selectedLanguages = languages?.length ? languages : ['en'];

    $: languageEntries = Object.entries(textsByLanguage).filter(([lang]) =>
        selectedLanguages.includes(lang)
    );

    function getModeText(
        texts: LanguageTexts,
        mode: InfoMode
    ): string | null | undefined {
        if (mode === 'intro') return texts.intro;
        if (mode === 'detail') return texts.detail;
        return texts.artist;
    }

    function languageLabel(lang: string): string {
        if (lang === 'en') return '🇺🇸 English';
        if (lang === 'es') return '🇪🇸 Español';
        if (lang === 'ptbr' || lang === 'pt-BR') return '🇧🇷 Português';
        return lang;
    }


</script>

{#if open}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" on:click={onClose} transition:fade></div>

    <!-- Modal -->
    <div
            bind:this={modalEl}
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="narration-modal-title"
            tabindex="-1"
            transition:fly={{ y: 30, duration: 160 }}
            on:touchstart={onTouchStart}
            on:touchmove={onTouchMove}
            on:touchend={onTouchEnd}
            on:scroll={handleScroll}
    >
        <!-- Grab handle -->
        <div class="grab-handle"></div>

        <!-- Header (Hero image + meta) -->
        <div
                class="album-header"
                style="transform: translateY({scrollY * 0.12}px);"
        >
            {#if headerImage}
                <div class="hero-wrap">
                    <img
                            src={headerImage}
                            alt={track?.artistName ?? 'Artist'}
                            class="hero-art"
                    />
                </div>
            {/if}

            <div class="album-text">
                <h2 id="narration-modal-title" class="track-title">{track?.trackName}</h2>
                <p class="track-artist">{track?.artistName}</p>
            </div>
        </div>


        <!-- Main text navigator -->
        <div class="modal-section">
            <div class="section-header">
                <button class="nav-btn" on:click|stopPropagation={prevMode}>‹</button>
                <h3>{headerLabel}</h3>
                <button class="nav-btn" on:click|stopPropagation={nextMode}>›</button>
            </div>

            {#if languageEntries.length > 0}
                <div class="language-texts" transition:fade>
                    {#each languageEntries as [lang, texts]}
                        {@const text = getModeText(texts, mode)}
                        {#if text}
                            <section class="language-block">
                                <h4>{languageLabel(lang)}</h4>
                                <p>{text}</p>
                            </section>
                        {/if}
                    {/each}
                </div>
            {:else}
                <p transition:fade>
                    {mode === 'intro'
                        ? (track?.intro ?? 'No narration available for this track.')
                        : mode === 'detail'
                            ? (track?.detail ?? 'No narration available for this track.')
                            : (track?.artistText ?? 'No narration available for this track.')}
                </p>
            {/if}

        </div>

        <!-- Close button -->
        <button bind:this={closeButton} class="close-btn" on:click={onClose} aria-label="Close narration">✕</button>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        z-index: 1100;
    }

    .modal {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);

        width: min(560px, 96vw); /* ✅ cap to mobile-ish size on desktop */
        max-height: 80vh;

        background: #111;
        color: #fff;
        padding: 0.75rem 1rem 2rem;
        border-radius: 16px 16px 0 0;
        overflow-y: auto;
        z-index: 1101;
        touch-action: pan-y;
    }


    .grab-handle {
        width: 48px;
        height: 5px;
        background: #444;
        border-radius: 3px;
        margin: 0.35rem auto 0.7rem;
    }

    .album-header {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        margin-bottom: 1.2rem;
        transition: transform 0.18s ease-out;
    }

    .track-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.3;
        text-align: center; /* 👈 ensure center */
    }

    .track-artist {
        margin-top: 2px;
        font-size: 0.9rem;
        opacity: 0.65;
        text-align: center; /* 👈 ensure center */
    }


    .modal-section {
        margin-top: 1rem;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .section-header h3 {
        font-size: 0.9rem;
        opacity: 0.9;
        margin: 0;
    }

    .nav-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #ddd;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        font-size: 1.2rem;
        cursor: pointer;
    }

    p {
        margin-top: 0.6rem;
        line-height: 1.45;
        opacity: 0.92;
    }

    .language-block {
        margin-top: 0.9rem;
    }

    .language-block h4 {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        opacity: 0.75;
    }

    .close-btn {
        position: absolute;
        top: 0.4rem;
        right: 0.75rem;
        background: none;
        border: none;
        color: #aaa;
        font-size: 1.25rem;
        cursor: pointer;
    }

    .hero-wrap {
        width: min(100%, 420px);
        aspect-ratio: 16 / 9;
        margin: 0 auto;
        overflow: hidden;
        border-radius: 18px;
    }


    .hero-art {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 20%;
        display: block;
    }

    .album-text {
        margin-top: 12px;
        text-align: center; /* 🔥 center it */
        padding: 0 8px;
    }


    @media (max-width: 640px) {
        .hero-wrap {
            max-height: 42vh;
            border-radius: 14px;
        }

        .track-title {
            font-size: 1.2rem;
        }

        .track-artist {
            font-size: 0.9rem;
        }
    }


</style>
