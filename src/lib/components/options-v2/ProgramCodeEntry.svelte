<script lang="ts">
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import {lookupProgramCode, ProgramCodeLookupError, programCodeUrl} from '$lib/api/programCode.js';

    export let language = 'en';
    export let languages: string[] = ['en'];
    export let voices: string[] = ['intro'];
    export let playbackOrder = 'up';
    export let voicePlayMode = 'before';
    export let pauseMode = 'pause';
    export let skipPlayed = false;

    const copy = {
        en: {
            heading: 'Enter a Program Number',
            supporting: 'Find the permanent number in the printed TopSpot40 catalog.',
            label: 'Program number', button: 'Find Program', loading: 'Finding program…',
            notFound: 'We couldn’t find that program number. Please check the catalog and try again.',
            service: 'We couldn’t reach the program catalog. Please try again shortly.',
            unavailable: 'That program cannot be opened because its catalog details are incomplete.'
        },
        es: {
            heading: 'Ingrese un número de programa',
            supporting: 'Encuentre el número permanente en el catálogo impreso de TopSpot40.',
            label: 'Número de programa', button: 'Buscar programa', loading: 'Buscando programa…',
            notFound: 'No pudimos encontrar ese número de programa. Revise el catálogo e inténtelo de nuevo.',
            service: 'No pudimos acceder al catálogo de programas. Inténtelo de nuevo en unos momentos.',
            unavailable: 'Ese programa no se puede abrir porque sus detalles de catálogo están incompletos.'
        },
        ptbr: {
            heading: 'Digite um número de programa',
            supporting: 'Encontre o número permanente no catálogo impresso do TopSpot40.',
            label: 'Número do programa', button: 'Encontrar programa', loading: 'Localizando programa…',
            notFound: 'Não encontramos esse número de programa. Confira o catálogo e tente novamente.',
            service: 'Não conseguimos acessar o catálogo de programas. Tente novamente em instantes.',
            unavailable: 'Esse programa não pode ser aberto porque os detalhes do catálogo estão incompletos.'
        }
    } as const;

    let code = '';
    let status: string | null = null;
    let statusKind: 'error' | 'status' | null = null;
    let lookingUp = false;
    let input: HTMLInputElement;
    $: text = copy[language as keyof typeof copy] ?? copy.en;

    onMount(() => {
        if (history.state?.topspotProgramCodeReturnFocus !== true) return;
        history.replaceState({...history.state, topspotProgramCodeReturnFocus: false}, '');
        requestAnimationFrame(() => input?.focus());
    });

    function clearStatus() {
        status = null;
        statusKind = null;
    }

    async function submit() {
        if (lookingUp) return;
        clearStatus();
        lookingUp = true;
        try {
            const program = await lookupProgramCode(code);
            const url = programCodeUrl(program, {language, languages, voices, playbackOrder, voicePlayMode, pauseMode, skipPlayed});
            if (!url) {
                status = text.unavailable;
                statusKind = 'error';
                return;
            }
            history.replaceState({...history.state, topspotProgramCodeReturnFocus: true}, '');
            await goto(url);
        } catch (error) {
            status = error instanceof ProgramCodeLookupError && error.kind === 'not-found'
                ? text.notFound
                : text.service;
            statusKind = 'error';
        } finally {
            lookingUp = false;
        }
    }
</script>

<section class="program-code-entry" aria-labelledby="program-code-heading">
    <h4 id="program-code-heading">{text.heading}</h4>
    <p>{text.supporting}</p>
    <form on:submit|preventDefault={submit}>
        <label for="program-code-input">{text.label}</label>
        <div class="form-row">
            <input
                id="program-code-input"
                bind:this={input}
                bind:value={code}
                on:input={clearStatus}
                placeholder="N-023"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck={false}
                aria-describedby="program-code-status"
                aria-invalid={statusKind === 'error'}
                disabled={lookingUp}
            />
            <button type="submit" disabled={lookingUp} aria-disabled={lookingUp}>
                {lookingUp ? text.loading : text.button}
            </button>
        </div>
    </form>
    <div id="program-code-status" class:status-error={statusKind === 'error'} role={statusKind === 'error' ? 'alert' : 'status'} aria-live="polite">
        {#if lookingUp}{text.loading}{:else}{status ?? ''}{/if}
    </div>
</section>

<style>
    .program-code-entry { margin: 1rem 0; padding: 1rem; border: 1px solid rgba(207,184,124,.45); border-radius: 12px; background: rgba(207,184,124,.08); text-align: left; }
    h4 { color: #cfb87c; margin: 0 0 .35rem; font-size: 1rem; }
    p, label { color: #d6d6d6; font-size: .85rem; }
    p { margin: 0 0 .75rem; }
    label { display: block; margin-bottom: .35rem; font-weight: 600; }
    .form-row { display: flex; gap: .6rem; }
    input, button { min-height: 44px; font: inherit; border-radius: 8px; }
    input { min-width: 0; flex: 1; padding: 0 .75rem; border: 1px solid #777; background: #171717; color: #fff; }
    button { padding: 0 .9rem; border: 1px solid #cfb87c; background: #cfb87c; color: #111; font-weight: 700; cursor: pointer; }
    input:focus-visible, button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    button:disabled, input:disabled { cursor: wait; opacity: .7; }
    #program-code-status { min-height: 1.3rem; margin-top: .6rem; color: #d6d6d6; font-size: .85rem; }
    #program-code-status.status-error { color: #ffb4a9; }
    @media (max-width: 480px) { .form-row { flex-direction: column; } button { width: 100%; } }
</style>
