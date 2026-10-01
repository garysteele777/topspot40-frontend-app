<script lang="ts">
    import {onMount} from 'svelte';
    import {loadMusicDocuseriesCollections, loadMusicDocuseriesStories, docuseriesCatalogStore} from './catalogAdapter';
    import {docuseriesHistoryStore, refreshDocuseriesHistory, docuseriesProgress, clearDocuseriesHistory} from './history';
    import {docuseriesText} from './groupPlayback';
    import {docuseriesCodeForSlug} from './programCodes';
    import {buildMusicDocuseriesLaunchUrl} from './launchMusicDocuseries';
    import {readLanguagePreference} from '$lib/languagePreferences';
    import type {MusicDocuseriesCollection} from './types';
    import type {Language} from '$lib/types/playback';
    let collections: MusicDocuseriesCollection[] = [];
    let language: Language = 'en';
    let selected = '';
    let loading = true;
    let error = false;
    $: text = docuseriesText[language];
    onMount(() => {
        language = readLanguagePreference();
        refreshDocuseriesHistory();
        void (async () => {
            try {
                collections = await loadMusicDocuseriesCollections();
                const results = await Promise.allSettled(collections.map(group => loadMusicDocuseriesStories(group.slug)));
                error = results.some(result => result.status === 'rejected');
            } catch { error = true; }
            finally { loading = false; }
        })();
    });
</script>

<section class="history-panel">
    <h3>{text.history}</h3>
    {#if loading}<p aria-live="polite">{text.loading}</p>{/if}
    {#if error}<p role="alert">{text.unavailable}</p>{/if}
    <div class="groups">
        {#each collections as group}
            {@const stories = $docuseriesCatalogStore[group.slug]}
            {#if stories}
                {@const progress = docuseriesProgress(stories, $docuseriesHistoryStore)}
                <div class="group">
                    <button class="group-title" on:click={() => selected = selected === group.slug ? '' : group.slug} aria-expanded={selected === group.slug}>
                        <strong>{group.name}</strong>
                        <span>{progress.complete ? `✓ ${text.allComplete}` : text.progress(progress.completed, progress.total)}</span>
                        <progress value={progress.completed} max={progress.total || 1} aria-label={group.name}></progress>
                    </button>
                    {#if selected === group.slug}
                        <ul>{#each stories as story}
                            <li><a href={buildMusicDocuseriesLaunchUrl({collectionSlug: group.slug, storySlug: story.slug, language})}>{docuseriesCodeForSlug(story.slug)} · {story.title}</a>
                                {#if $docuseriesHistoryStore[story.slug]}<span>✓ {text.complete}</span>{/if}
                            </li>
                        {/each}</ul>
                        <button class="clear" on:click={() => { if (confirm(text.confirmClear)) clearDocuseriesHistory(stories.map(story => story.slug)); }}>{text.clear}</button>
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
</section>

<style>
    .history-panel {margin-top:16px;color:#eee;}
    h3 {color:#cfb87c;}
    .groups {display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}
    .group {background:#242424;border:1px solid #cfb87c44;border-radius:14px;padding:12px;}
    .group-title {display:grid;gap:8px;width:100%;text-align:left;background:transparent;border:0;color:#eee;font:inherit;cursor:pointer;min-height:64px;}
    .group-title span {font-size:.85rem;color:#cfb87c;}
    progress {width:100%;accent-color:#cfb87c;}
    ul {list-style:none;padding:0;}
    li {display:grid;gap:4px;margin:14px 0;}
    a {color:#f7dc82;text-decoration:none;}
    li span {font-size:.85rem;color:#bce2b7;}
    .clear {min-height:44px;border:1px solid #cfb87c;background:transparent;color:#cfb87c;border-radius:8px;padding:8px 12px;cursor:pointer;}
    button:focus-visible,a:focus-visible {outline:2px solid #f7dc82;outline-offset:3px;}
</style>
