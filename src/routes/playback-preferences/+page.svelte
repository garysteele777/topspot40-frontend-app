<script lang="ts">
    import {onMount} from 'svelte';
    import {dev} from '$app/environment';
    import {get} from 'svelte/store';

    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import PlaybackPreferencesPanel from '$lib/components/options-v2/PlaybackPreferencesPanel.svelte';

    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';

    import type {
        Language,
        PlaybackOrder,
        VoicePart
    } from '$lib/types/playback';

    const initialPlaybackSettings = get(playbackSettingsStore);

    let language: Language = 'en';
    let languages: Language[] = ['en'];

    let selectedVoices: VoicePart[] = [
        ...initialPlaybackSettings.voices
    ];

    let detailLength = initialPlaybackSettings.detailLength;

    let playbackMethod: 'automatic' | 'guided' =
        dev ? initialPlaybackSettings.playbackMethod : 'guided';

    let playbackOrder: PlaybackOrder =
        initialPlaybackSettings.playbackOrder;

    let pauseMode: 'pause' | 'continuous' =
        initialPlaybackSettings.pauseMode;

    let skipPlayed = initialPlaybackSettings.skipPlayed;

    let hydrated = false;

    onMount(() => {
        const savedLanguage = localStorage.getItem('topspot_language');

        if (
            savedLanguage === 'en'
            || savedLanguage === 'es'
            || savedLanguage === 'ptbr'
        ) {
            language = savedLanguage;
            languages = [savedLanguage];
        }

        hydrated = true;
    });

    $: if (hydrated) {
        localStorage.setItem('topspot_language', language);
        localStorage.setItem('tts_language', language);

        playbackSettingsStore.set({
            voices: selectedVoices,
            playbackMethod: dev ? playbackMethod : 'guided',
            playbackOrder,
            pauseMode,
            voicePlayMode: 'before',
            skipPlayed,
            detailLength
        });
    }

    function goBack() {
        history.back();
    }
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
                <h1>⚙️ TopSpot40 Playback Preferences</h1>
                <p>
                    Choose how TopSpot40 sounds and plays your music.
                </p>
            </div>
        </div>

        <PlaybackPreferencesPanel
                bind:language
                bind:languages
                bind:selectedVoices
                bind:detailLength
                bind:playbackMethod
                showPlaybackMethod={dev}
                bind:playbackOrder
                bind:pauseMode
                bind:skipPlayed
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
        background: transparent;
        color: #f5d66e;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        font: inherit;
    }

    .back-button:hover {
        background: rgba(207, 184, 124, 0.12);
    }
</style>