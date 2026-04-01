<script lang="ts">
    type Language = 'en' | 'es' | 'ptbr';
    export let language: Language = 'en';
</script>

<div class="card">
    <h3>Preview Language</h3>
    <p class="hint">English available now — more languages coming soon.</p>

    <div class="grid">
        <button class:selected={language === 'en'} on:click={() => (language = 'en')}>
            English
        </button>

        <button disabled>
            Español
        </button>

        <button disabled>
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

    button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
</style>