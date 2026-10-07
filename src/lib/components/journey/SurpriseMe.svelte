<script lang="ts">
    import {onDestroy} from 'svelte';
    import {createSurprisePicker} from '$lib/interactions/surpriseMe.js';

    export let language: 'en' | 'es' | 'ptbr' = 'en';
    export let items: {code: string; name: string}[] = [];
    export let onHighlight: (code: string, finished: boolean) => void = () => {};
    export let onGo: (code: string) => void;
    let spinning = false;
    let displayed: {code: string; name: string} | null = null;
    let result: {code: string; name: string} | null = null;
    const copy = {
        en: {pick: 'Surprise Me', again: 'Pick Again', go: 'Let’s Go', choosing: 'Choosing…', result: 'Your pick'},
        es: {pick: 'Sorpréndeme', again: 'Elegir otra vez', go: 'Vamos', choosing: 'Eligiendo…', result: 'Tu selección'},
        ptbr: {pick: 'Surpreenda-me', again: 'Escolher novamente', go: 'Vamos lá', choosing: 'Escolhendo…', result: 'Sua escolha'}
    };
    let pickAudio: AudioContext | null = null;
    let audioCloseTimer: ReturnType<typeof setTimeout> | undefined;
    let noteIndex = 0;
    const melody = [523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 659.25];

    function stopMusic() {
        clearTimeout(audioCloseTimer);
        const context = pickAudio;
        pickAudio = null;
        if (context && context.state !== 'closed') void context.close().catch(() => {});
    }
    function startMusic() {
        stopMusic();
        noteIndex = 0;
        try {
            pickAudio = new window.AudioContext();
            void pickAudio.resume().catch(() => {});
        } catch {
            // Picking still works if the browser cannot play the optional flourish.
            pickAudio = null;
        }
    }
    function playNote(frequency: number, length = .22, volume = .20) {
        const context = pickAudio;
        if (!context || context.state === 'closed') return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, now + length);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => {oscillator.disconnect(); gain.disconnect();};
        oscillator.start(now);
        oscillator.stop(now + length + .02);
    }
    function finishMusic() {
        for (const frequency of [523.25, 659.25, 783.99]) playNote(frequency, .65, .11);
        audioCloseTimer = setTimeout(stopMusic, 800);
    }
    const picker = createSurprisePicker({
        onFrame: (item: {code: string; name: string}) => {
            displayed = item;
            onHighlight(item.code, false);
            if (spinning && noteIndex < 12) playNote(melody[noteIndex++ % melody.length]);
        },
        onFinish: (item: {code: string; name: string}) => {
            result = item;
            finishMusic();
            spinning = false;
            onHighlight(item.code, true);
        }
    });
    function start() {
        spinning = true;
        result = null;
        startMusic();
        picker.start(items);
    }
    onDestroy(() => {picker.stop(); stopMusic(); onHighlight('', false);});
</script>

<div class="surprise">
    <button type="button" class="pick" disabled={spinning || !items.length} on:click={start}>
        <span aria-hidden="true">🎲</span> {result ? copy[language].again : copy[language].pick}
    </button>
    {#if displayed}
        <div class="reveal" aria-busy={spinning}>
            <span>{spinning ? copy[language].choosing : copy[language].result}</span>
            <strong aria-hidden={spinning}>{displayed.name} · {displayed.code}</strong>
        </div>
    {/if}
    <span class="sr-only" role="status">{result ? `${copy[language].result}: ${result.name}, ${result.code}` : ''}</span>
    {#if result}
        <button type="button" class="go" on:click={() => result && onGo(result.code)}>{copy[language].go} →</button>
    {/if}
</div>

<style>
    .surprise {display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 12px; margin: 0 0 18px; background: #242015; border: 1px solid #b49a4c; border-radius: 12px;}
    button {min-height: 46px; padding: 10px 18px; border: 2px solid #f7dc82; border-radius: 999px; background: #f7dc82; color: #181309; font: inherit; font-weight: 800; cursor: pointer;}
    button:disabled {opacity: .65; cursor: default;}
    button:focus-visible {outline: 3px solid white; outline-offset: 3px;}
    .go {background: #75ef4f; border-color: #b7ff9c;}
    .reveal {flex: 1; min-width: 180px; color: #fff0bb;}
    .reveal span, .reveal strong {display: block;}
    .reveal span {font-size: 13px; margin-bottom: 4px;}
    .sr-only {position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);}
    @media (max-width: 600px) {.surprise {gap: 10px;} .reveal {flex-basis: 100%; order: 2;} .go {margin-left: auto;}}
</style>
