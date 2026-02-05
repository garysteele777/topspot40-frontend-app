<script lang="ts">
    import {
        programHistoryStore as programHistory,
        resetProgram,
        resetAllPrograms,
        type ProgramHistory
    } from '$lib/carmode/programHistory';


    // ─────────────────────────────────────────────
    // Derived groupings
    // ─────────────────────────────────────────────

    $: decadeGenreMap = (() => {
        const map = new Map<string, ProgramHistory[]>();

        for (const p of $programHistory) {
            if (!p.key.startsWith('DG|')) continue;

            const [, decade] = p.key.split('|');
            if (!decade) continue;

            if (!map.has(decade)) map.set(decade, []);
            map.get(decade)!.push(p);
        }

        return [...map.entries()].map(([decade, programs]) => ({
            decade,
            programs
        }));
    })();


    $: collectionPrograms = $programHistory.filter(
        (p): p is ProgramHistory => p.key.startsWith('COL|')
    );


    function playedCount(p: ProgramHistory): number {
        return p.playedRanks.length;
    }

    function isCompleted(p: ProgramHistory): boolean {
        return p.playedRanks.length >= p.total;
    }


    function clearOne(p: ProgramHistory) {
        resetProgram(p.key);
    }

    function clearAll() {
        resetAllPrograms();
    }


</script>

<section class="history-panel">
    <header class="history-header">
        <h3>Playback History</h3>
        <p class="history-sub">
            Resume or clear previously played programs
        </p>
    </header>

    <!-- ───────────── Decade–Genre ───────────── -->
    <details class="history-section" open>
        <summary class="history-section__summary">
            🎵 Decade–Genre Programs
        </summary>

        <div class="history-section__body">
            {#if decadeGenreMap.length === 0}
                <p class="history-empty">No decade–genre programs played yet.</p>
            {:else}
                {#each decadeGenreMap as block}
                    <details class="history-subsection">
                        <summary class="history-subsection__summary">
                            {block.decade}
                        </summary>

                        <ul class="history-list">
                            {#each block.programs as p}
                                <li class="history-row">
                                    <span class="history-row__label">
                                        {p.label}
                                    </span>

                                    <span class="history-row__progress">
                                      {isCompleted(p)
                                          ? `Completed (${p.total} / ${p.total})`
                                          : `${playedCount(p)} / ${p.total}`}
                                    </span>


                                    <div class="history-row__actions">
                                        <button class="btn btn--primary">
                                            ▶ {isCompleted(p) ? 'Restart' : 'Resume'}
                                        </button>
                                        <button
                                                class="btn btn--ghost"
                                                on:click={() => clearOne(p)}
                                                aria-label="Clear playback history"
                                        >
                                            🧹
                                        </button>

                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </details>
                {/each}
            {/if}
        </div>
    </details>

    <!-- ───────────── Collections ───────────── -->
    <details class="history-section">
        <summary class="history-section__summary">
            📦 Collections
        </summary>

        <div class="history-section__body">
            {#if collectionPrograms.length === 0}
                <p class="history-empty">No collections played yet.</p>
            {:else}
                <ul class="history-list">
                    {#each collectionPrograms as p}
                        <li class="history-row">
                            <span class="history-row__label">
                                {p.label}
                            </span>

                            <span class="history-row__progress">
                              {isCompleted(p)
                                  ? 'Completed'
                                  : `${playedCount(p)} / ${p.total}`}
                            </span>


                            <div class="history-row__actions">
                                <button class="btn btn--primary">
                                    ▶ {isCompleted(p) ? 'Restart' : 'Resume'}
                                </button>
                                <button
                                        class="btn btn--ghost"
                                        on:click={() => clearOne(p)}
                                        aria-label="Clear playback history"
                                >
                                    🧹
                                </button>

                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </details>

    <!-- ───────────── Global Reset ───────────── -->
    <footer class="history-footer">
        <button class="btn btn--danger" on:click={clearAll}>
            🧹 Clear All Playback History
        </button>

    </footer>
</section>

<style>
    .history-panel {
        margin-top: 16px;
        padding: 14px;
        border-radius: 14px;
        border: 1px solid rgba(207, 184, 124, 0.35);
        background: rgba(14, 14, 14, 0.96);
        font-size: 0.85rem;
    }

    .history-header h3 {
        margin: 0;
        font-size: 1rem;
    }

    .history-sub {
        opacity: 0.7;
        margin-top: 2px;
    }

    .history-section {
        margin-top: 10px;
    }

    .history-section__summary,
    .history-subsection__summary {
        cursor: pointer;
        padding: 6px 8px;
        border-radius: 8px;
        font-weight: 600;
    }

    .history-list {
        list-style: none;
        padding: 0;
        margin: 6px 0 0;
    }

    .history-row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 10px;
        align-items: center;
        padding: 6px 8px;
        border-radius: 8px;
    }

    .history-row__progress {
        opacity: 0.8;
        white-space: nowrap;
    }

    .history-row__actions {
        display: flex;
        gap: 6px;
    }

    .history-empty {
        opacity: 0.6;
        padding: 6px;
    }

    .history-footer {
        margin-top: 14px;
        text-align: center;
    }
</style>
