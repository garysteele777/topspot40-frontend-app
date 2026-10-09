<script lang="ts">
    import type {Language} from '$lib/types/playback';
    import {writeLanguagePreference} from '$lib/languagePreferences';

    export let language: Language = 'en';
    export let onChange: ((next: Language) => void) | undefined = undefined;

    const labels = {
        en: 'Narration language',
        es: 'Idioma de narración',
        ptbr: 'Idioma da narração'
    };
    const options: {code: Language; name: string}[] = [
        {code: 'en', name: 'English'},
        {code: 'es', name: 'Español'},
        {code: 'ptbr', name: 'Português'}
    ];

    function selectLanguage(next: Language) {
        if (next === language) return;
        if (onChange) {
            onChange(next);
            return;
        }
        writeLanguagePreference(next);
        const destination = new URL(window.location.href);
        if (destination.searchParams.has('language')) {
            destination.searchParams.set('language', next);
        }
        if (destination.searchParams.has('languages')) {
            destination.searchParams.set('languages', next);
        }
        window.location.replace(destination.href);
    }
</script>

<div class="language-selector">
    <span class="label">{labels[language]}</span>
    <div class="options" role="group" aria-label={labels[language]}>
        {#each options as option}
            <button type="button"
                class:selected={language === option.code}
                aria-pressed={language === option.code}
                on:click={() => selectLanguage(option.code)}
            >{option.name}</button>
        {/each}
    </div>
</div>

<style>
    .language-selector { font-family: Arial, sans-serif; }
    .label {
        display: block;
        margin-bottom: 4px;
        color: #fff4d1;
        font-size: 12px;
        text-align: center;
    }
    .options { display: flex; justify-content: center; gap: 4px; }
    button {
        min-height: 34px;
        padding: 6px 9px;
        border: 1px solid #a58c47;
        border-radius: 7px;
        background: #171717;
        color: #fff;
        font: inherit;
        font-size: 14px;
        cursor: pointer;
    }
    button.selected {
        background: #f5dc8a;
        color: #211706;
        font-weight: 700;
    }
    button:hover { border-color: #fff4d1; }
    button:focus-visible { outline: 3px solid white; outline-offset: 2px; }
    @media (max-width: 600px) {
        button { min-height: 44px; padding: 8px 14px; }
    }
</style>
