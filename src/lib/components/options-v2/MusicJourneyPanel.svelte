<script lang="ts">
    import CollectionsJourneyPanel from '$lib/components/journey/CollectionsJourneyPanel.svelte';
    import NostalgiaJourneyPanel from '$lib/components/journey/NostalgiaJourneyPanel.svelte';
    import DocuseriesHistoryPanel from '$lib/musicDocuseries/DocuseriesHistoryPanel.svelte';

    export let collapsed = false;
    export let onActivate: (() => void) | undefined = undefined;

    export let collectionGroups: {
        name: string;
        slug: string;
        items: { name: string; slug: string }[];
    }[] = [];

    export let title = 'My TopSpot40 Music Journey';
    export let description = 'Track your music journey and favorite discoveries.';

    let musicJourneyMode:
        | 'nostalgia'
        | 'collections'
        | 'docuseries'
        | null = null;

</script>

<div class="opt-cell music-journey-card">
    {#if onActivate}
        <div
                class="section-header-row section-header-clickable"
                role="button"
                tabindex="0"
                on:click={() => {
                    onActivate?.();
                }}
                on:keydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onActivate?.();
                    }
                }}
        >
            <h3 class="section-title">🎵 {title}</h3>
            <span class="section-toggle">{collapsed ? '▼' : '▲'}</span>
        </div>

        <div class="radio-description">
            {description}
        </div>
    {/if}

    {#if !collapsed}
        <div class="radio-buttons">
            <button
                    type="button"
                    class:active={musicJourneyMode === 'nostalgia'}
                    on:click={() => {
                musicJourneyMode = 'nostalgia';
            }}
            >
                Nostalgia History & Favorites
            </button>

            <button
                    type="button"
                    class:active={musicJourneyMode === 'collections'}
                    on:click={() => {
                musicJourneyMode = 'collections';
            }}
            >
                Collections History & Favorites
            </button>

            <button type="button" class:active={musicJourneyMode === 'docuseries'} on:click={() => musicJourneyMode = 'docuseries'}>Docuseries History</button>

        </div>
    {/if}
</div>

{#if !collapsed && musicJourneyMode === 'docuseries'}<DocuseriesHistoryPanel/>{/if}

{#if !collapsed && musicJourneyMode === 'nostalgia'}
    <NostalgiaJourneyPanel/>
{/if}

{#if !collapsed && musicJourneyMode === 'collections'}
    <CollectionsJourneyPanel {collectionGroups}/>
{/if}

<style>
    .opt-cell {
        background: rgba(18, 18, 18, 0.95);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        transition: transform 0.18s ease-out, box-shadow 0.18s ease-out, border-color 0.18s ease-out, background-color 0.18s ease-out;
    }

    .section-title {
        font-size: 0.78rem;
        color: #cfb87c;
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
    }


    /* RADIO DESCRIPTION */
    .radio-description {
        font-size: 0.8rem;
        color: #aaa;
        margin-bottom: 0.5rem;
        line-height: 1.3;
    }

    /* RADIO BUTTONS */
    .radio-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }

    .radio-buttons button {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    /* ACTIVE STATE (matches your gold theme) */
    .radio-buttons button.active {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }

    .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .section-title {
        margin: 0;
    }

    .section-toggle {
        color: #cfb87c;
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1;
        opacity: 0.95;
    }

    .section-header-clickable {
        cursor: pointer;
    }

</style>
