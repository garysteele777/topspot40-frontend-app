<script lang="ts">
    import {onMount} from 'svelte';

    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import MusicJourneyPanel from '$lib/components/options-v2/MusicJourneyPanel.svelte';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';

    import type {Language} from '$lib/types/playback';
    import {goto} from '$app/navigation';
    import {readStoredLanguagePreference} from '$lib/languagePreferences';

    let language: Language = 'en';

    let collectionGroups: {
        name: string;
        slug: string;
        items: {
            name: string;
            slug: string;
        }[];
    }[] = [];

    function goBack() {
        history.back();
    }

    onMount(async () => {
        const savedLanguage = readStoredLanguagePreference();

        if (savedLanguage) {
            language = savedLanguage;
        }

        try {
            const normalized = await loadCatalogOnce();
            collectionGroups = normalized.collectionGroups ?? [];
        } catch (error) {
            console.error('Error loading Music Journey catalog:', error);
        }
    });
</script>

<div class="page-shell">
    <PublicJourneyHeader {language}/>

    <main class="page">
        <div class="page-heading">
            <button
                    class="back-button"
                    type="button"
                    on:click={goBack}
            >
                ← Back
            </button>
            <div>
                <h1>🎵 My TopSpot40 Music Journey</h1>
                <p>Track your musical journey through TopSpot40.</p>
            </div>
        </div>

        <MusicJourneyPanel
                {collectionGroups}
                title="My TopSpot40 Music Journey"
                description="Track your musical journey through TopSpot40."
                collapsed={false}
        />
    </main>
</div>

<style>
    .page-shell {
        min-height: 100vh;
        background: radial-gradient(
                circle at top,
                #1f1f1f 0,
                #121212 45%,
                #050505 100%
        );
    }

    .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem 1.25rem 4rem;
        color: #f5f5f5;
    }

    .page-heading {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(207, 184, 124, 0.35);
    }

    .page-heading h1 {
        margin: 0;
        color: #cfb87c;
        font-size: 1.5rem;
    }

    .page-heading p {
        margin: 0.4rem 0 0;
        color: #aaa;
    }

    .back-button {
        display: inline-block;
        padding: 0.55rem 0.8rem;
        border: 1px solid rgba(207, 184, 124, 0.65);
        border-radius: 8px;
        color: #f5d66e;
        text-decoration: none;
        white-space: nowrap;
        background: transparent;
        cursor: pointer;
        font: inherit;
    }

    .back-button:hover {
        background: rgba(207, 184, 124, 0.12);
    }
</style>
