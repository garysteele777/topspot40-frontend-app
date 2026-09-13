<script lang="ts">
    import {
        audioDebugEntries,
        clearAudioDebugLog,
        copyAudioDebugLog
    } from '$lib/audio/audioDebug';

    let copied = false;

    async function copyLog(): Promise<void> {
        await copyAudioDebugLog();
        copied = true;
        window.setTimeout(() => (copied = false), 1500);
    }
</script>

<aside class="audio-debug" aria-label="Audio diagnostics">
    <div class="debug-header">
        <strong>Audio debug</strong>
        <span>{$audioDebugEntries.length} events</span>
        <button type="button" on:click={copyLog}>{copied ? 'Copied' : 'Copy Log'}</button>
        <button type="button" on:click={clearAudioDebugLog}>Clear Log</button>
    </div>
    <ol aria-live="polite">
        {#each $audioDebugEntries as entry}
            <li>
                <time>{entry.timestamp.slice(11, 23)}</time>
                <b>{entry.event}</b>
                {#if entry.details}
                    <span>{Object.entries(entry.details).filter(([, value]) => value !== undefined).map(([key, value]) => `${key}=${value}`).join(' ')}</span>
                {/if}
            </li>
        {/each}
    </ol>
</aside>

<style>
    .audio-debug { position: fixed; right: 8px; bottom: 8px; z-index: 5000; width: min(390px, calc(100vw - 16px)); max-height: 36vh; overflow: hidden; border: 1px solid #76d7ff; border-radius: 10px; color: #eaf8ff; background: rgba(7, 18, 27, .96); box-shadow: 0 6px 24px rgba(0, 0, 0, .45); font: 11px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .debug-header { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 7px; border-bottom: 1px solid #36576a; }
    .debug-header span { color: #a9c4d2; margin-right: auto; }
    button { min-height: 30px; padding: 4px 7px; border: 1px solid #70a8bf; border-radius: 5px; color: #eaf8ff; background: #183747; font: inherit; }
    ol { max-height: calc(36vh - 48px); margin: 0; padding: 5px 8px 8px 28px; overflow: auto; }
    li { margin: 0 0 4px; overflow-wrap: anywhere; }
    time { color: #8bb7cb; } b { color: #fff1a8; margin-left: 4px; } li span { color: #c5d6df; margin-left: 4px; }
</style>
