<script lang="ts">
    export let language = 'en';
    export let onReport: () => void;

    $: label =
        language === 'es'
            ? 'Informar un problema'
            : language === 'ptbr' || language === 'pt-BR'
                ? 'Informar um problema'
                : 'Report a Problem';
</script>

<button
    type="button"
    class="report-problem-button"
    on:pointerdown|stopPropagation
    on:pointerup|stopPropagation
    on:pointercancel|stopPropagation
    on:click|stopPropagation={onReport}
>
    {label}
</button>

<style>
    .report-problem-button {
        min-height: 44px;
        padding: 9px 14px;
        border: 1px solid #9b8050;
        border-radius: 999px;
        background: #24211b;
        color: #fff;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
    }

    .report-problem-button:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 3px;
    }
</style>
