<script lang="ts">
    type Language = 'en' | 'es' | 'ptbr';

    export let language: Language = 'en';
    export let languages: Language[] = ['en'];

    const order: Language[] = ['en', 'es', 'ptbr'];

    function toggleLanguage(lang: Language): void {
        const selected = new Set(languages);

        if (selected.has(lang)) {
            if (selected.size === 1) return;
            selected.delete(lang);
        } else {
            selected.add(lang);
        }

        languages = order.filter(l => selected.has(l));
        language = languages[0] ?? 'en';
    }

    function isSelected(lang: Language): boolean {
        return languages.includes(lang);
    }
</script>

<div class="card">
    <h3>Narration Languages</h3>
    <p class="hint">Select one or more narration languages.</p>

<div class="grid">
    <button
        type="button"
        class:selected={isSelected('en')}
        on:click={() => toggleLanguage('en')}
    >
        English
    </button>

    <button
        type="button"
        class:selected={isSelected('es')}
        on:click={() => toggleLanguage('es')}
    >
        Español
    </button>

    <button
        type="button"
        class:selected={isSelected('ptbr')}
        on:click={() => toggleLanguage('ptbr')}
    >
        Português
    </button>
</div>
</div>

<style>
    .card {
        background: #181818;
        border-radius: 10px;
        padding: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    h3 {
        margin: 0 0 0.2rem;
        font-size: 1rem;
    }

    .hint {
        margin: 0 0 0.5rem;
        font-size: 0.8rem;
        color: #a8a8a8;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
    }

    button {
        width: 100%;
        border-radius: 999px;
        border: 0;
        padding: 0.45rem 0.6rem;
        font-size: 0.9rem;
        cursor: pointer;
        background: #333;
        color: #e0e0e0;
    }

    button.selected {
        background: #1db954;
        color: #000;
        font-weight: 600;
    }
</style>