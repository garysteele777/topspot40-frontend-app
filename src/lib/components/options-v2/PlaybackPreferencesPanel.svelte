<script lang="ts">
</script>

<div class="opt-cell playback-preferences-card">
    <h3 class="section-title">⚙ TopSpot40 Playback Preferences</h3>

    <div class="radio-description">
        Choose narration languages, voice content, playback order, and listening flow.
    </div>

    <div class="radio-buttons">
        <button type="button">
            Narration
        </button>

        <button type="button">
            Playback
        </button>

        <button type="button">
            Flow
        </button>
    </div>
</div>

<style>
    .opt-cell {
        background: rgba(18, 18, 18, 0.95);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    }

    .section-title {
        font-size: 0.78rem;
        color: #cfb87c;
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
    }

    .radio-description {
        font-size: 0.8rem;
        color: #aaa;
        margin-bottom: 0.5rem;
        line-height: 1.3;
    }

    .radio-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
    }

    .radio-buttons button {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
    }

</style>