<script lang="ts">
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import {loadCollectionsJourneyCatalog} from '$lib/collections/catalogAdapter';
    import {localizedCollectionCopy} from '$lib/config/collectionsJourney';
    import type {JourneyCollectionGroup} from '$lib/collections/types';
    import {
        COLLECTIONS_RADIO_STORAGE_KEY,
        normalizeCollectionsRadioGroups,
        parseCollectionsRadioGroups
    } from '$lib/journey/collectionsRadioGroups';

    export let onContinue: (selected: string[], all: string[]) => void;

    let groups: JourneyCollectionGroup[] = [];
    let selectedGroups: string[] = [];
    let previewSlug = '';
    let loading = true;
    let error = '';

    $: selectedCount = selectedGroups.length;
    $: previewGroup = groups.find(group => group.slug === previewSlug) ?? groups[0];
    $: continueLabel = `Continue with ${selectedCount} Collection Groups`;

    function saveSelection(next: readonly string[], updateUrl = true): void {
        selectedGroups = normalizeCollectionsRadioGroups(next, groups);
        try { localStorage.setItem(COLLECTIONS_RADIO_STORAGE_KEY, selectedGroups.join(',')); } catch { /* optional persistence */ }
        if (!updateUrl || typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.delete('collection_groups');
        for (const slug of selectedGroups) url.searchParams.append('collection_groups', slug);
        if (previewSlug) url.searchParams.set('preview_group', previewSlug);
        void goto(`${url.pathname}${url.search}`, {replaceState: true, keepFocus: true, noScroll: true});
    }

    function focusAndToggle(group: JourneyCollectionGroup): void {
        previewSlug = group.slug;
        saveSelection(
            selectedGroups.includes(group.slug)
                ? selectedGroups.filter(slug => slug !== group.slug)
                : [...selectedGroups, group.slug]
        );
    }

    function selectAll(): void { saveSelection(groups.map(group => group.slug)); }
    function clearAll(): void { saveSelection([]); }
    function continueToRadio(): void {
        if (selectedCount > 0) onContinue(selectedGroups, groups.map(group => group.slug));
    }

    onMount(async () => {
        try {
            groups = await loadCollectionsJourneyCatalog();
            const params = new URL(window.location.href).searchParams;
            const urlValues = params.getAll('collection_groups');
            const stored = (() => { try { return localStorage.getItem(COLLECTIONS_RADIO_STORAGE_KEY); } catch { return null; } })();
            selectedGroups = urlValues.length > 0
                ? parseCollectionsRadioGroups(urlValues, groups)
                : stored !== null
                    ? parseCollectionsRadioGroups([stored], groups)
                    : groups.map(group => group.slug);
            previewSlug = groups.some(group => group.slug === params.get('preview_group'))
                ? params.get('preview_group') as string
                : groups[0]?.slug ?? '';
        } catch (reason) {
            console.error('Failed to load Collections Radio groups', reason);
            error = 'We could not load Collection Groups.';
        } finally {
            loading = false;
        }
    });
</script>

<main class="selection-page">
    <section class="selector" aria-labelledby="collections-radio-heading">
        <h1 id="collections-radio-heading">Collections Radio</h1>
        <p>Select the Collection Groups you want to include. Selecting a group also previews its collections.</p>
        {#if loading}
            <p>Loading Collection Groups…</p>
        {:else if error}
            <p role="alert">{error}</p>
        {:else}
            <div class="actions"><button type="button" on:click={selectAll}>Select All Collection Groups</button><button type="button" on:click={clearAll}>Clear All Collection Groups</button></div>
            <p class="count" aria-live="polite">{selectedCount} of {groups.length} Collection Groups selected</p>
            <div class="layout">
                <div class="group-list" aria-label="Collection Groups">
                    {#each groups as group (group.slug)}
                        <button type="button" class:selected={selectedGroups.includes(group.slug)} class:preview={previewGroup?.slug === group.slug} aria-pressed={selectedGroups.includes(group.slug)} on:click={() => focusAndToggle(group)}>
                            <span>{group.presentation.icon}</span><span>{group.name}</span><small>{selectedGroups.includes(group.slug) ? 'Selected' : 'Not selected'}</small>
                        </button>
                    {/each}
                </div>
                {#if previewGroup}
                    <article class="preview" style={`--accent: ${previewGroup.presentation.accent}`}>
                        <p class="eyebrow">Previewed Collection Group</p><h2>{previewGroup.name}</h2>
                        <p>{localizedCollectionCopy(previewGroup.presentation.description, 'en')}</p>
                        <strong>{previewGroup.items.length} {previewGroup.items.length === 1 ? 'collection' : 'collections'} • {previewGroup.totalTracks} tracks</strong>
                        <ul aria-label={`${previewGroup.name} collections`}>
                            {#each previewGroup.items as collection (collection.slug)}<li>{collection.name}</li>{/each}
                        </ul>
                    </article>
                {/if}
            </div>
            <button class="continue" type="button" disabled={selectedCount === 0} on:click={continueToRadio}>{continueLabel} <span aria-hidden="true">→</span></button>
        {/if}
    </section>
</main>

<style>
    .selection-page{min-height:calc(100vh - 72px);padding:clamp(20px,4vw,54px);color:#fff;background:linear-gradient(145deg,#17140d,#080806)}.selector{max-width:1180px;margin:auto}.selector h1{margin:0;color:#f7dc82;font:clamp(32px,4vw,48px) Georgia,serif}.actions{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0}.actions button,.continue{padding:11px 15px;border:1px solid #f7dc82;border-radius:999px;color:#f7dc82;background:#282115;font-weight:800;cursor:pointer}.count{color:#fff0b0;font-weight:800}.layout{display:grid;grid-template-columns:minmax(250px,.8fr) minmax(0,1.4fr);gap:22px}.group-list{display:grid;gap:8px}.group-list button{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:8px;align-items:center;padding:11px;text-align:left;color:#fff;background:#25231e;border:1px solid #665b3c;border-radius:10px;cursor:pointer}.group-list button.selected{border-color:#75ef4f;box-shadow:inset 0 0 0 1px #75ef4f}.group-list button.preview{outline:3px solid #f7dc82;outline-offset:1px}.group-list small{color:#d8d1c2}.preview{padding:24px;background:#17140d;border:2px solid var(--accent);border-radius:16px}.preview h2{margin:0;color:#f7dc82;font:32px Georgia,serif}.eyebrow{color:var(--accent);font-weight:900;text-transform:uppercase}.preview ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding-left:20px}.continue{width:100%;margin-top:22px;color:#211706;background:#f7dc82;border-color:#fff0b0;font-size:17px}.continue:disabled{cursor:not-allowed;opacity:.45}@media(max-width:760px){.layout{grid-template-columns:1fr}.preview ul{grid-template-columns:1fr}}
</style>
