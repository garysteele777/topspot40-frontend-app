<script lang="ts">
    import {
        musicDocuseriesCollectionArtwork,
        musicDocuseriesCollectionDescription,
        musicDocuseriesCollectionPresentation
    } from '$lib/config/musicDocuseriesJourney';
    import type {MusicDocuseriesCollection, MusicDocuseriesStory} from '$lib/musicDocuseries/types';

    export let collection: MusicDocuseriesCollection;
    export let stories: MusicDocuseriesStory[] = [];
    export let storiesLoading = false;
    export let storiesError: string | null = null;
    export let exploreLabel = 'Explore';
    export let loadingLabel = 'Loading available stories…';
    export let emptyLabel = 'No stories are currently available in this collection.';

    $: presentation = musicDocuseriesCollectionPresentation(collection.slug);
    $: description = musicDocuseriesCollectionDescription(collection);
    $: previewStories = stories.slice(0, 8);
    $: remainingStories = Math.max(0, stories.length - previewStories.length);
    $: exploreHref = `/journey-prototype/music-docuseries/${encodeURIComponent(collection.slug)}`;
    $: artwork = musicDocuseriesCollectionArtwork(collection.slug);
</script>

<article class="preview" style={`--series-accent: ${presentation.accent}`}>
    <div class="heading">
        <div class="artwork" aria-hidden="true">
            <img src={artwork} alt=""/>
            <span class="artwork-shade"></span>
        </div>
        <div>
            <p class="eyebrow">Selected Music Docuseries Collection</p>
            <h2>{collection.name}</h2>
            <small>{presentation.kicker}</small>
        </div>
    </div>

    <p class="description">{description}</p>

    <section class="stories" aria-labelledby="available-stories-heading">
        <h3 id="available-stories-heading">Available stories and episodes</h3>
        {#if storiesLoading}
            <p class="preview-state" aria-live="polite">{loadingLabel}</p>
        {:else if storiesError}
            <p class="preview-state error" role="alert">{storiesError}</p>
        {:else if stories.length === 0}
            <p class="preview-state">{emptyLabel}</p>
        {:else}
            <ul aria-label={`${collection.name} story preview`}>
                {#each previewStories as story, index (`${story.id}:${story.slug}`)}
                    <li><span>{index + 1}</span>{story.title}</li>
                {/each}
                {#if remainingStories > 0}
                    <li class="more">+{remainingStories} more</li>
                {/if}
            </ul>
        {/if}
    </section>

    <a class="explore" href={exploreHref}>
        {exploreLabel} {collection.name}<span aria-hidden="true">→</span>
    </a>
</article>

<style>
    .preview {
        min-height: 100%;
        padding: clamp(22px, 3vw, 32px);
        color: #fff;
        background: linear-gradient(145deg, rgba(44, 36, 23, .97), rgba(10, 10, 10, .97));
        border: 2px solid var(--series-accent);
        border-radius: 20px;
        box-shadow: 0 0 30px color-mix(in srgb, var(--series-accent) 22%, transparent);
    }

    .heading {
        display: grid;
        grid-template-columns: 104px minmax(0, 1fr);
        gap: 18px;
        align-items: center;
    }

    .artwork {
        position: relative;
        width: 104px;
        height: 104px;
        overflow: hidden;
        background: #21190d;
        border: 1px solid rgba(247, 220, 130, .55);
        border-radius: 17px;
    }

    .artwork img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: none;
    }

    .artwork-shade {
        position: absolute;
        inset: 0;
        background: radial-gradient(
                circle at 48% 42%,
                transparent 45%,
                rgba(9, 6, 2, .32)
        );
    }

    .eyebrow {
        margin: 0 0 5px;
        color: var(--series-accent);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .1em;
        text-transform: uppercase;
    }

    h2 {
        margin: 0;
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: clamp(27px, 3vw, 40px);
        line-height: 1.08;
    }

    .heading small {
        display: block;
        margin-top: 7px;
        color: #d7cdb9;
        font-weight: 800;
    }

    .description {
        margin: 19px 0 16px;
        color: #f4eedc;
        font-size: 17px;
        line-height: 1.55;
    }

    .stories {
        padding-top: 15px;
        border-top: 1px solid rgba(215, 166, 74, .28);
    }

    .stories h3 {
        margin: 0 0 11px;
        color: #fff0bb;
        font-family: Georgia, serif;
        font-size: 19px;
    }

    .stories ul {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 18px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .stories li {
        display: flex;
        min-width: 0;
        align-items: baseline;
        gap: 8px;
        color: #eee5d2;
        line-height: 1.35;
    }

    .stories li span {
        display: inline-grid;
        min-width: 22px;
        height: 22px;
        place-items: center;
        flex: 0 0 auto;
        color: #24180a;
        background: var(--series-accent);
        border-radius: 50%;
        font-size: 11px;
        font-weight: 900;
    }

    .stories .more {
        color: #c8c1b3;
        font-style: italic;
    }

    .preview-state {
        min-height: 48px;
        margin: 0;
        color: #cfc6b5;
    }

    .preview-state.error {
        color: #ffb4aa;
    }

    .explore {
        display: inline-flex;
        min-height: 46px;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
        padding: 12px 20px;
        color: #171006;
        background: var(--series-accent);
        border: 2px solid #ffe0a2;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 900;
    }

    .explore:hover, .explore:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 3px;
    }

    @media (min-width: 801px) and (min-height: 800px) {
        .preview {
            padding: 22px 26px;
        }

        .heading {
            grid-template-columns: 88px minmax(0, 1fr);
        }

        .artwork {
            width: 88px;
            height: 88px;
        }

        .description {
            margin: 14px 0 12px;
            font-size: 16px;
        }

        .stories {
            padding-top: 12px;
        }

        .stories ul {
            gap: 6px 16px;
        }

        .explore {
            margin-top: 15px;
        }
    }

    @media (max-width: 600px) {
        .heading {
            grid-template-columns: 78px minmax(0, 1fr);
            gap: 14px;
        }

        .artwork {
            width: 78px;
            height: 78px;
        }

        .stories ul {
            grid-template-columns: 1fr;
        }

        .explore {
            width: 100%;
            justify-content: center;
            text-align: center;
        }
    }
</style>
