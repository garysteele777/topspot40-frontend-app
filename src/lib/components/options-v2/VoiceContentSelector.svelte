<script lang="ts">
    import type {DetailLength, VoicePart, Language} from '$lib/types/playback';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
    export let selectedVoices: VoicePart[] = ['intro', 'detail'];
    export let detailLength: DetailLength = 'short';
    export let language: Language = 'en';
    const copy = {
        en: {programs:'Nostalgia and Collections', intros:'Introductions', details:'Track details (all three pages)', bios:'Artist bios', once:'Play the short biography once per artist during the program.', spotlight:'Artist Spotlight', bio:'Artist biography', help:'Introductions are not used in Artist Spotlight. Long biographies apply only here.', off:'Off', on:'On', short:'Short', long:'Long', next:'Changes apply to the next narration.'},
        es: {programs:'Nostalgia y Colecciones', intros:'Introducciones', details:'Detalles de canciones (las tres páginas)', bios:'Biografías de artistas', once:'Reproducir la biografía breve una vez por artista durante el programa.', spotlight:'Artist Spotlight', bio:'Biografía del artista', help:'Artist Spotlight no usa introducciones. Las biografías largas se aplican solo aquí.', off:'Desactivado', on:'Activado', short:'Breve', long:'Larga', next:'Los cambios se aplican a la siguiente narración.'},
        ptbr: {programs:'Nostalgia e Coleções', intros:'Introduções', details:'Detalhes das músicas (as três páginas)', bios:'Biografias dos artistas', once:'Reproduzir a biografia curta uma vez por artista durante o programa.', spotlight:'Artist Spotlight', bio:'Biografia do artista', help:'Artist Spotlight não usa introduções. Biografias longas se aplicam somente aqui.', off:'Desativado', on:'Ativado', short:'Curta', long:'Longa', next:'As alterações se aplicam à próxima narração.'}
    };
    $: text = copy[language];
    function toggle(part: VoicePart, enabled: boolean) {
        selectedVoices = [...selectedVoices.filter(p => p !== part), ...(enabled ? [part] : [])];
    }
</script>
<div class="card">
    <h3>{text.programs}</h3>
    <fieldset><legend>{text.intros}</legend><div class="choices">
        {#each [false, true] as enabled}<button type="button" aria-pressed={selectedVoices.includes('intro') === enabled} on:click={() => toggle('intro', enabled)}>{enabled ? text.on : text.off}</button>{/each}
    </div></fieldset>
    <fieldset><legend>{text.bios}</legend><p>{text.once}</p><div class="choices">
        {#each [false, true] as enabled}<button type="button" aria-pressed={selectedVoices.includes('artist') === enabled} on:click={() => toggle('artist', enabled)}>{enabled ? text.on : text.off}</button>{/each}
    </div></fieldset>
    <fieldset><legend>{text.details}</legend><div class="choices">
        {#each ['off', 'short', 'long'] as value}<button type="button" aria-pressed={detailLength === value} on:click={() => detailLength = value as DetailLength}>{text[value as DetailLength]}</button>{/each}
    </div></fieldset>
    <h3>{text.spotlight}</h3><p>{text.help}</p>
    <fieldset><legend>{text.bio}</legend><div class="choices">
        {#each ['off', 'short', 'long'] as value}<button type="button" aria-pressed={($playbackSettingsStore.spotlightBioLength ?? 'short') === value} on:click={() => playbackSettingsStore.update(current => ({...current, spotlightBioLength:value as DetailLength}))}>{text[value as DetailLength]}</button>{/each}
    </div></fieldset>
    <p>{text.next}</p>
</div>
<style>
.card {background:#181818;border:1px solid #444;border-radius:10px;padding:1rem;color:#eee}
h3 {margin:.3rem 0 .8rem} h3:not(:first-child){margin-top:1.5rem}
fieldset {border:0;padding:0;margin:1rem 0} legend {font-weight:700;margin-bottom:.4rem}
p {font-size:.9rem;color:#bbb;margin:.4rem 0 .7rem}
.choices {display:flex;gap:.5rem;flex-wrap:wrap}
button {flex:1;min-height:44px;border:1px solid #666;border-radius:8px;background:#333;color:white;padding:.5rem;cursor:pointer}
button[aria-pressed="true"] {background:#1db954;color:#111;font-weight:700;border-color:#1db954}
button:focus-visible {outline:3px solid white;outline-offset:3px}
</style>
