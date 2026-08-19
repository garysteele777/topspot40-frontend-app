<script lang="ts">
    import ProgramJourneyShell from '$lib/components/journey/ProgramJourneyShell.svelte';
    import {COLLECTIONS_JOURNEY_ARTWORK} from '$lib/config/collectionsJourney';
    import type {Language} from '$lib/types/playback';

    export let language: Language = 'en';
    export let title: string;
    export let instruction: string;
    export let backHref: string;
    export let backLabel = 'Back';
    export let accent = '#75ef4f';
</script>

<ProgramJourneyShell
    {language}
    {title}
    {instruction}
    {backHref}
    {backLabel}
    {accent}
    artwork={COLLECTIONS_JOURNEY_ARTWORK}
    artworkAlt="A grand musical library welcoming listeners to explore curated collections"
>
    <slot/>
</ProgramJourneyShell>