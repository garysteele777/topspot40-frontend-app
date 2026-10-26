<script lang="ts">
    import {onMount} from 'svelte';
    import {getFavorites} from '$lib/favorites/favorites';
    import {lookupProgramCode} from '$lib/api/programCode.js';
    import {getBackendUrl} from '$lib/config';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    type Snapshot = {active: boolean; done: boolean; error: string; completed: number[];
        rank: number | null; phase: string; playing: boolean; status: string; language: string;
        mode?: string; context: Record<string, any>; preferences: Record<string, any>; tracks: CarModeTrack[]};
    export let controller: {snapshot: () => Snapshot; prepare: (ranks: number[]) => Snapshot;
        reserve: () => boolean; start: () => Promise<void>; stop: (message?: string) => void};
    type Plan = {suffix: string; ranks: number[]};
    let opened = false;
    let key = '';
    let code = '';
    let choice = '1';
    let sectionChoices: {value: string; label: string}[] = [];
    let sectionCount = 5;
    let running = false;
    let connecting = false;
    let message = 'Connect the Windows recorder to begin.';
    let files: string[] = [];
    let folder = '';
    let session = '';
    let run = '';
    let generation = 0;
    let disposed = false;
    let wakeLock: any = null;
    let dialogElement: HTMLDivElement;
    let oldFocus: HTMLElement | null = null;
    const endpoint = 'http://127.0.0.1:8766';

    async function api(path: string, body: Record<string, any> = {}, keepalive = false): Promise<any> {
        const response = await fetch(endpoint + path, {method: 'POST',
            headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + key.trim()},
            body: JSON.stringify(body), signal: AbortSignal.timeout(7000), keepalive});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Recorder request failed.');
        return data;
    }
    function recordingLastRank(snapshot: Snapshot): number {
        if (snapshot.mode === 'decade_genre') return 45;
        if (snapshot.mode !== 'collection' || !snapshot.tracks.length) throw new Error('Choose a loaded Nostalgia or Collections program.');
        const ranks = snapshot.tracks.map(t => Number(t.rank));
        const last = Math.max(...ranks);
        if (!Number.isInteger(last) || last < 1 || last > 999) throw new Error('The collection has invalid track ranks.');
        return last;
    }
    function section(n: number, last: number): Plan {
        const first = (n - 1) * 9 + 1;
        if (!Number.isInteger(n) || n < 1 || first > last) throw new Error('This program has no tracks in that section.');
        const count = Math.min(9, last - first + 1);
        return {suffix: String(n).padStart(2, '0'), ranks: Array.from({length: count}, (_, i) => first + i)};
    }
    function plans(snapshot: Snapshot): Plan[] {
        const last = recordingLastRank(snapshot);
        if (choice === 'all') return Array.from({length: Math.ceil(last / 9)}, (_, i) => section(i + 1, last));
        if (choice !== 'favs') return [section(Number(choice), last)];
        const isCollection = snapshot.mode === 'collection';
        const group = snapshot.tracks[0]?.favoriteGroup ?? (isCollection
            ? `${snapshot.context.collection_slug}|${snapshot.context.collection_group_slug}`
            : `${snapshot.context.decade}|${snapshot.context.genre}`);
        const ids = getFavorites(isCollection ? 'COL' : 'DG', group);
        if (!ids.length) throw new Error('This program has no starred favorites.');
        const selected = snapshot.tracks.filter(t => (t.favoriteGroup ?? group) === group && t.rankingId != null && ids.includes(t.rankingId))
            .map(t => Number(t.rank)).sort((a, b) => a - b);
        if (selected.length !== new Set(ids).size) throw new Error('Some saved favorites are missing from this loaded track list.');
        return [{suffix: 'Favs', ranks: selected}];
    }
    async function connect() {
        connecting = true;
        try {
            if (!key.trim()) throw new Error('Paste the connection key printed by recorder_service.py.');
            await api('/health');
            sessionStorage.setItem('topspot-local-recorder-key', key.trim());
            message = 'Recorder connected. Set your options, then start recording.';
        } catch (e) { message = errorText(e); }
        finally { connecting = false; }
    }
    function errorText(e: unknown): string {
        return e instanceof TypeError ? 'Cannot reach the recorder. Start recorder_service.py and check the connection key and browser permission for local network access.' : String(e instanceof Error ? e.message : e);
    }
    function close() {
        if (running) return;
        opened = false;
        oldFocus?.focus();
    }
    function keydown(event: KeyboardEvent) {
        if (!opened) return;
        event.stopImmediatePropagation();
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'Tab' && dialogElement) {
            const controls = [...dialogElement.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)')];
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
    }
    async function open(event: Event) {
        if (running) { opened = true; return; }
        oldFocus = document.activeElement as HTMLElement;
        opened = true;
        files = []; folder = ''; code = ''; message = 'Choose sections or favorites. Your current narration settings will be used.';
        try {
            const last = recordingLastRank(controller.snapshot());
            sectionCount = Math.ceil(last / 9);
            sectionChoices = Array.from({length: sectionCount}, (_, i) => {
                const first = i * 9 + 1;
                return {value: String(i + 1), label: `Record section ${i + 1} — tracks ${first}–${Math.min(first + 8, last)}`};
            });
            if (choice !== 'all' && choice !== 'favs' && Number(choice) > sectionCount) choice = '1';
        } catch (e) { sectionChoices = []; message = errorText(e); }

        const name = (event as CustomEvent<{name: string}>).detail?.name;
        if (name) {
            try {
                const response = await fetch(`${getBackendUrl()}/api/catalog/programs`, {signal: AbortSignal.timeout(7000)});
                if (!response.ok) return;
                const payload = await response.json();
                const matches = (payload.programs || []).filter((p: any) => p.is_active && p.name?.trim().toLowerCase() === name.trim().toLowerCase() && /^[NC]-\d{3}$/.test(p.code));
                if (matches.length === 1) code = matches[0].code;
            } catch { /* Code can also be entered manually and is checked against the catalog. */ }
        }
    }
    async function abort(messageText = 'Recording stopped. Partial MP3 retained.') {
        generation++;
        controller.stop(messageText);
        const previous = session;
        session = '';
        if (previous) { try { await api('/abort', {session: previous}, true); } catch { /* Watchdog stops capture if disconnected. */ } }
        running = false;
        message = messageText;
        await wakeLock?.release(); wakeLock = null;
    }
    async function record() {
        // Reserve the Spotify window in this actual click, before asynchronous requests.
        if (running) return;
        const snapshot = controller.snapshot();
        if (snapshot.playing) { message = 'Stop current playback before recording.'; return; }
        if (!controller.reserve()) { message = 'Allow TopSpot40 popups, then try again.'; return; }
        const ticket = ++generation;
        running = true; files = []; folder = ''; session = ''; run = '';
        try {
            if (!key.trim()) throw new Error('Connect the Windows recorder first.');
            const match = /^([NC])?-?(\d{1,3})$/i.exec(code.trim());
            if (!match || +match[2] < 1) throw new Error('Enter a Nostalgia N-xxx or Collections C-xxx program code.');
            const prefix = (match[1] || (snapshot.mode === 'collection' ? 'C' : 'N')).toUpperCase();
            const normalizedCode = `${prefix}-${String(+match[2]).padStart(3, '0')}`;
            await api('/health');
            const catalog = await lookupProgramCode(normalizedCode);
            const matchesNostalgia = snapshot.mode === 'decade_genre' && catalog.kind === 'nostalgia' &&
                String(catalog.target?.decade_slug) === String(snapshot.context.decade) &&
                String(catalog.target?.genre_slug) === String(snapshot.context.genre);
            const collectionSlug = snapshot.context.collection_slug ?? snapshot.context.collectionSlug;
            const matchesCollection = snapshot.mode === 'collection' && catalog.kind === 'collection' &&
                typeof collectionSlug === 'string' && !!collectionSlug && catalog.target?.slug === collectionSlug;
            if (!matchesNostalgia && !matchesCollection) throw new Error('The program code does not match the loaded program.');
            const jobs = plans(snapshot);
            // Check every requested block before any capture or playback begins.
            for (const plan of jobs) controller.prepare(plan.ranks);
            const preferences = JSON.stringify(snapshot.preferences);
            try { wakeLock = await (navigator as any).wakeLock?.request('screen'); } catch { /* Keep PC awake manually if unavailable. */ }
            for (const plan of jobs) {
                if (ticket !== generation || disposed) throw new Error('Recording cancelled.');
                if (JSON.stringify(controller.snapshot().preferences) !== preferences) throw new Error('Narration preferences changed. Recording stopped.');
                const prepared = controller.prepare(plan.ranks);
                const started = await api('/start', {program: normalizedCode, suffix: plan.suffix, ranks: plan.ranks,
                    run: run || null, preferences: {...prepared.preferences, language: prepared.language},
                    tracks: prepared.tracks.filter(t => plan.ranks.includes(Number(t.rank))).map(t => ({rank: t.rank, title: t.trackName, artist: t.artistName}))});
                // Even if Stop was pressed while /start was pending, retain the returned session so it can be aborted.
                session = started.session; run = started.run; folder = started.folder;
                if (ticket !== generation || disposed) { await api('/abort', {session}, true); session = ''; throw new Error('Recording cancelled.'); }
                message = `Recording ${started.file} — ${started.device}`;
                // Narration can take longer than the helper's disconnect timeout.
                // Monitor capture immediately while the first narration plays.
                void controller.start().catch(error => {
                    if (ticket === generation && !disposed) controller.stop(errorText(error));
                });
                let heartbeat = 0;
                let pausedSince = 0;
                let stalledSince = Date.now();
                let marker = '';
                while (true) {
                    if (ticket !== generation || disposed) throw new Error('Recording cancelled.');
                    const state = controller.snapshot();
                    if (state.error) throw new Error(state.error);
                    if (JSON.stringify(state.preferences) !== preferences || state.language !== snapshot.language ||
                        JSON.stringify(state.context) !== JSON.stringify(snapshot.context)) throw new Error('Program or narration options changed. Recording stopped.');
                    const expectedRank = plan.ranks[state.completed.length];
                    if (!state.done && Number(state.rank) !== expectedRank) throw new Error('Playback moved outside the recording plan.');
                    if (Date.now() - heartbeat > 1500) { await api('/heartbeat', {session}); heartbeat = Date.now(); }
                    if (state.done) {
                        if (JSON.stringify(state.completed) !== JSON.stringify(plan.ranks)) throw new Error('Playback completion did not match the selected ranks.');
                        break;
                    }
                    if (!state.active) throw new Error('Playback stopped before the selected tracks finished.');
                    if (state.phase === 'paused' || !state.playing) {
                        pausedSince ||= Date.now();
                        if (Date.now() - pausedSince > 15000) throw new Error('Playback paused or failed to start. Partial recording retained.');
                    } else pausedSince = 0;
                    const nextMarker = `${state.rank}/${state.phase}/${state.completed.length}`;
                    if (nextMarker !== marker) { stalledSince = Date.now(); marker = nextMarker; }
                    if (Date.now() - stalledSince > 15 * 60 * 1000) throw new Error('Playback stalled for 15 minutes.');
                    message = `Recording ${started.file} · Track ${state.rank} · ${state.phase} · ${state.completed.length}/${plan.ranks.length} finished`;
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
                const finished = await api('/finish', {session, completed: plan.ranks});
                session = '';
                if (finished.status !== 'recorded_needs_listening_review') throw new Error(finished.error || 'Audio capture failed.');
                files = [...files, finished.file];
            }
            controller.stop();
            message = 'Recording finished. Listen to the MP3s to check narration, music and song endings.';
        } catch (e) {
            await abort(errorText(e));
        } finally {
            running = false;
            await wakeLock?.release(); wakeLock = null;
        }
    }
    onMount(() => {
        key = sessionStorage.getItem('topspot-local-recorder-key') || '';
        window.addEventListener('topspot-open-recorder', open);
        window.addEventListener('keydown', keydown, true);
        const leave = () => { if (running) void abort('Recording page closed. Partial MP3 retained.'); };
        window.addEventListener('pagehide', leave);
        return () => {
            disposed = true; leave();
            window.removeEventListener('topspot-open-recorder', open);
            window.removeEventListener('keydown', keydown, true);
            window.removeEventListener('pagehide', leave);
        };
    });
</script>

{#if opened}
    <div class="recorder-overlay">
        <div class="recorder-panel" role="dialog" aria-modal="true" aria-labelledby="recorder-title" tabindex="-1" bind:this={dialogElement}>
            <header><div><span class="eyebrow">TOPSPOT40 · LOCAL RECORDING</span><h2 id="recorder-title">Record Program</h2></div><button disabled={running} on:click={close} aria-label="Close recorder">✕</button></header>
            <label>Windows recorder connection key<input type="password" bind:value={key} disabled={running} autocomplete="off" placeholder="Paste key from the recorder terminal" /></label>
            <button on:click={connect} disabled={running || connecting}>{connecting ? 'Connecting…' : 'Connect Recorder'}</button>
            <label>Program number<input bind:value={code} disabled={running} placeholder="N-001" maxlength="5" /></label>
            <label>What would you like to record?<select bind:value={choice} disabled={running}>
                {#each sectionChoices as sectionChoice}
                    <option value={sectionChoice.value}>{sectionChoice.label}</option>
                {/each}
                <option value="all">Record all sections — {sectionCount} MP3s</option>
                <option value="favs">Record Favorites only — one MP3</option>
            </select></label>
            <p>Includes music and your current narration settings. Tracks play in ascending order, including previously played tracks. Favorites use only this program’s starred songs.</p>
            <p class="hint">Keep this tab visible and the PC awake. Use Spotify playback in this browser on this PC. Other computer sounds will also be captured.</p>
            <div class="actions"><button class="start" disabled={running || connecting} on:click={record}>● Start Recording</button><button disabled={!running} on:click={() => abort()}>■ Stop Recording</button></div>
            <p class="status" role="status">{message}</p>
            {#if files.length}<ul>{#each files as file}<li>{file}</li>{/each}</ul>{/if}
            {#if folder}<label>Saved in<input readonly value={folder} /></label>{/if}
        </div>
    </div>
{/if}

<style>
.recorder-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:#000c;color:#fff1ce;font-family:Arial,sans-serif}
.recorder-panel{width:min(560px,95vw);max-height:90dvh;overflow:auto;padding:26px;border:1px solid #dcaa43;border-radius:18px;background:linear-gradient(145deg,#302010,#100c08);box-shadow:0 14px 70px #000}
header{display:flex;justify-content:space-between;align-items:center;gap:15px}h2{font:30px Georgia,serif;margin:8px 0 20px}.eyebrow{font-size:11px;letter-spacing:.12em;color:#edc56c}
label{display:block;font-size:14px;font-weight:bold;margin:16px 0 10px}input,select{display:block;box-sizing:border-box;width:100%;padding:12px;margin-top:7px;border:1px solid #b38a43;border-radius:7px;background:#15120f;color:#fff2d5;font:16px Arial,sans-serif}
button{border:1px solid #d4a444;border-radius:8px;background:#382513;color:#fbe3a0;padding:11px 16px;font-weight:bold;cursor:pointer}button:disabled{opacity:.45;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #fff1aa;outline-offset:2px}.start{background:#efc367;color:#211304}.actions{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}p{font-size:14px;line-height:1.5}.hint{color:#cebfa3}.status{background:#080705;padding:12px;border-radius:8px;color:#ffe39f}ul{line-height:1.7}
</style>
