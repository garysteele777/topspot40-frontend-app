<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {goto} from '$app/navigation';
    import {backendUrl} from '$lib/api/backendBase';
    import {readLanguagePreference} from '$lib/languagePreferences';
    import {loadMusicDocuseriesCollections, loadMusicDocuseriesStories} from './catalogAdapter';
    import {buildDocuseriesQueue, docuseriesText, type DocuseriesGroupMode} from './groupPlayback';
    import {docuseriesHistoryStore, refreshDocuseriesHistory, markDocuseriesComplete, hasListenedEnough} from './history';
    import {docuseriesCodeForSlug} from './programCodes';
    import {isSafeMusicDocuseriesReturnPath} from './launchMusicDocuseries';
    import {musicDocuseriesCollectionArtwork} from '$lib/config/musicDocuseriesJourney';
    import type {MusicDocuseriesStory} from './types';
    import type {Language} from '$lib/types/playback';
    import {get} from 'svelte/store';

    export let search: string;
    type Recording = {ok: boolean; title?: string; slug?: string; story_text?: string; duration_seconds?: number;
        tts_bucket?: string; tts_key?: string; artwork_url?: string; bed_bucket?: string; bed_key?: string;
        has_youtube_video?: boolean; youtube_url?: string};
    const storageBase = 'https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/';
    let language: Language = 'en';
    let collection = '';
    let groupName = '';
    let returnTo = '/journey-prototype/music-docuseries';
    let mode: DocuseriesGroupMode | null = null;
    let queue: MusicDocuseriesStory[] = [];
    let recordings = new Map<string, Promise<Recording | null>>();
    let index = 0;
    let story: Recording | null = null;
    let audio: HTMLAudioElement;
    let bed: HTMLAudioElement;
    let loading = true;
    let playing = false;
    let started = false;
    let finished = false;
    let introduction = false;
    let introPending = false;
    let groupCuePending = false;
    let cue: 'group' | 'story' | null = null;
    let message = '';
    let showText = false;
    let currentTime = 0;
    let duration = 0;
    let run = 0;
    let activeSlug = '';
    let disposed = false;
    const abort = new AbortController();
    $: text = docuseriesText[language];
    $: currentSlug = queue[index]?.slug ?? '';
    $: complete = Boolean($docuseriesHistoryStore[currentSlug]);
    $: title = introduction ? text.introduction : story?.title ?? queue[index]?.title ?? groupName;
    $: code = introduction ? null : docuseriesCodeForSlug(currentSlug);
    $: progress = duration > 0 ? Math.min(100, currentTime / duration * 100) : 0;

    async function fetchRecording(slug: string): Promise<Recording | null> {
        try {
            const query = new URLSearchParams({slug, language: language === 'ptbr' ? 'pt-BR' : language});
            const response = await fetch(backendUrl(`/music-docuseries/play?${query}`), {method: 'POST', signal: abort.signal});
            if (!response.ok) return null;
            const value: Recording = await response.json();
            return value.ok && value.tts_bucket && value.tts_key ? value : null;
        } catch { return null; }
    }

    function recordingFor(slug: string) {
        if (!recordings.has(slug)) recordings.set(slug, fetchRecording(slug).then(recording => {
            if (!recording) recordings.delete(slug);
            return recording;
        }));
        return recordings.get(slug)!;
    }

    function trackCompletion() {
        currentTime = audio?.currentTime ?? 0;
        duration = Number.isFinite(audio?.duration) ? audio.duration : 0;
        if (activeSlug && audio && hasListenedEnough(audio.played, duration)) {
            markDocuseriesComplete(activeSlug);
        }
    }

    function pause() {
        trackCompletion();
        audio?.pause();
        bed?.pause();
        playing = false;
    }

    function releaseAudio() {
        pause();
        activeSlug = '';
        audio?.removeAttribute('src');
        audio?.load();
        bed?.removeAttribute('src');
        bed?.load();
        currentTime = 0;
        duration = 0;
    }

    function stop() {
        ++run;
        releaseAudio();
        started = false;
        finished = false;
        loading = false;
        message = '';
        // Stop resets the current story, never saves a timestamp.
        if (introduction) introPending = true;
        if (cue === 'group') { groupCuePending = true; introPending = mode === 'all'; }
        introduction = false;
        cue = null;
    }

    async function playAudio(token: number) {
        try {
            await audio.play();
            if (disposed || token !== run) return;
            playing = true;
            if (bed.getAttribute('src')) void bed.play().catch(() => {});
        } catch {
            if (!disposed && token === run && !message) {
                playing = false;
                message = text.blocked;
            }
        }
    }

    async function startCurrent(withStoryCue = true) {
        const token = ++run;
        releaseAudio();
        message = '';
        showText = false;
        finished = false;
        started = true;
        cue = null;
        audio.volume = 0.75;
        if (groupCuePending) {
            groupCuePending = false;
            introduction = true;
            cue = 'group';
            audio.volume = 0.45;
            audio.src = '/docuseries/cues/group-opening.mp3';
            loading = false;
            setMediaMetadata();
            await playAudio(token);
            return;
        }
        if (introPending && mode === 'all') {
            introduction = true;
            introPending = false;
            audio.src = `/docuseries/group-intros/${language}/${encodeURIComponent(collection)}.mp3`;
            loading = false;
            setMediaMetadata();
            await playAudio(token);
            return;
        }
        introduction = false;
        loading = true;
        // Read the queue directly: Svelte's reactive currentSlug updates on
        // the next flush, while Next starts this function immediately.
        const slug = queue[index]?.slug ?? '';
        const recording = await recordingFor(slug);
        if (disposed || token !== run) return;
        story = recording;
        loading = false;
        if (!story) { started = false; message = text.unavailable; return; }
        if (withStoryCue) {
            cue = 'story';
            audio.volume = 0.45;
            audio.src = '/docuseries/cues/story-opening.mp3';
        } else {
            activeSlug = slug;
            audio.src = `${storageBase}${story.tts_bucket}/${story.tts_key}`;
            if (story.bed_bucket && story.bed_key) bed.src = `${storageBase}${story.bed_bucket}/${story.bed_key}`;
        }
        setMediaMetadata();
        // Prepare the next response while this story plays; keep the same
        // narration element for transitions and phone media controls.
        if (queue[index + 1]) void recordingFor(queue[index + 1].slug);
        await playAudio(token);
    }

    async function toggle() {
        if (playing) { pause(); return; }
        if (finished) { index = 0; introPending = mode === 'all'; groupCuePending = Boolean(mode); }
        if (!started || finished) { await startCurrent(); return; }
        message = '';
        await playAudio(run);
    }

    async function next() {
        if (introduction) { introPending = false; await startCurrent(); return; }
        if (index + 1 < queue.length) { ++index; await startCurrent(); }
        else {
            ++run;
            releaseAudio();
            started = false;
            finished = true;
            message = '';
        }
    }

    function ended() {
        trackCompletion();
        playing = false;
        bed.pause();
        if (cue || introduction) void startCurrent(cue !== 'story');
        else if (mode) void next();
        else { started = false; }
    }

    function audioError() {
        if (!audio?.getAttribute('src') || disposed) return;
        playing = false;
        bed.pause();
        if (cue || introduction) {
            // An absent introduction must not prevent the group from playing.
            void startCurrent(cue !== 'story');
        } else { started = false; message = text.unavailable; }
    }

    function setMediaMetadata() {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
        const artwork = introduction ? musicDocuseriesCollectionArtwork(collection) : story?.artwork_url;
        navigator.mediaSession.metadata = new MediaMetadata({title: introduction ? text.introduction : story?.title ?? '',
            artist: 'TopSpot40', album: groupName, artwork: artwork ? [{src: artwork}] : []});
    }

    function time(seconds: number) {
        return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
    }

    onMount(() => {
        refreshDocuseriesHistory();
        bed.volume = 0.006;
        audio.volume = 0.75;
        const query = new URLSearchParams(search);
        const selected = query.get('language');
        language = selected === 'pt-BR' || selected === 'ptbr' ? 'ptbr'
            : selected === 'es' ? 'es' : selected === 'en' ? 'en' : readLanguagePreference();
        collection = query.get('collection') ?? '';
        const group = query.get('group');
        mode = group === 'all' || group === 'unheard' ? group : null;
        const destination = query.get('returnTo');
        if (isSafeMusicDocuseriesReturnPath(destination)) returnTo = destination;
        else if (collection) returnTo = `/journey-prototype/music-docuseries/${encodeURIComponent(collection)}`;
        if ('mediaSession' in navigator) {
            for (const [action, handler] of [['play', () => { if (!playing) void toggle(); }], ['pause', pause], ['stop', stop],
                ['nexttrack', () => void next()]] as const) {
                try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Unsupported on some devices. */ }
            }
        }
        void (async () => {
            try {
                if (mode && collection) {
                    const [collections, stories] = await Promise.all([loadMusicDocuseriesCollections(), loadMusicDocuseriesStories(collection)]);
                    if (disposed) return;
                    groupName = collections.find(item => item.slug === collection)?.name ?? collection;
                    queue = buildDocuseriesQueue(stories, mode, get(docuseriesHistoryStore));
                    introPending = mode === 'all';
                    groupCuePending = true;
                } else {
                    const slug = query.get('slug');
                    if (!slug) throw new Error('Missing story');
                    queue = [{id: 0, slug, title: '', sort_order: 0}];
                }
                if (queue.length) story = await recordingFor(queue[0].slug);
                if (disposed) return;
                if (!queue.length) message = text.empty;
                else if (!story) message = text.unavailable;
            } catch { if (!disposed) message = text.unavailable; }
            finally { if (!disposed) loading = false; }
        })();
    });

    onDestroy(() => {
        disposed = true;
        ++run;
        abort.abort();
        releaseAudio();
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            for (const action of ['play', 'pause', 'stop', 'nexttrack'] as const) {
                try { navigator.mediaSession.setActionHandler(action, null); } catch { /* Unsupported. */ }
            }
        }
    });
</script>

<audio bind:this={audio} preload="auto" on:timeupdate={trackCompletion} on:ended={ended}
    on:pause={() => { trackCompletion(); playing = false; bed?.pause(); }}
    on:play={() => playing = true} on:loadedmetadata={trackCompletion} on:error={audioError}></audio>
<audio bind:this={bed} loop preload="none"></audio>
<div class="doc-player">
    <button class="secondary" on:click={() => { stop(); void goto(returnTo); }}>← {text.back}</button>
    <section class="player-card">
        <p class="label">Music Docuseries{code ? ` · ${code}` : ''}</p>
        {#if mode}<p>{groupName} · {mode === 'all' ? text.playAll : text.playUnheard}</p>{/if}
        {#if loading}<p aria-live="polite">{text.loading}</p>{/if}
        {#if introduction || story?.artwork_url}
            <img src={introduction ? musicDocuseriesCollectionArtwork(collection) : story?.artwork_url} alt=""/>
        {/if}
        <h1>{title}</h1>
        {#if complete && !introduction}<p class="complete">✓ {text.complete}</p>{/if}
        {#if mode && queue.length && !introduction}<p>{text.story} {index + 1} {text.of} {queue.length}</p>{/if}
        {#if started && !cue}<progress value={progress} max="100" aria-label={title}></progress><p>{time(currentTime)} / {time(duration)}</p>
        {:else if story?.duration_seconds}<p>{Math.max(1, Math.round(story.duration_seconds / 60))} min</p>{/if}
        {#if message}<p role="status">{message}</p>{/if}
        {#if finished}<p role="status">{text.finished}</p>{/if}
        <div class="controls">
            {#if queue.length}
                <button disabled={loading} on:click={toggle}>{playing ? `⏸ ${text.pause}` : started ? `▶ ${text.resume}` : `▶ ${mode ? text.start : text.play}`}</button>
                {#if started}<button class="secondary" on:click={stop}>■ {text.stop}</button>{/if}
                {#if mode && !finished && (introduction || index + 1 < queue.length)}<button class="secondary" disabled={loading} on:click={next}>{text.next} →</button>{/if}
            {/if}
        </div>
        {#if mode && !finished && (introduction || queue[index + 1])}
            <p class="up-next">{text.upNext}: {introduction ? queue[index]?.title : queue[index + 1]?.title}</p>
        {/if}
        {#if !introduction && story?.story_text}
            <button class="secondary text-button" on:click={() => showText = !showText}>{showText ? text.hideText : text.showText}</button>
            {#if showText}<div class="story-text">{#each story.story_text.split('\n').filter(p => p.trim()) as paragraph}<p>{paragraph}</p>{/each}</div>{/if}
        {/if}
        {#if !introduction && story?.has_youtube_video && story.youtube_url}
            <a class="secondary text-button" href={story.youtube_url} target="_blank" rel="noopener noreferrer">▶ {language === 'es' ? 'Ver documental' : language === 'ptbr' ? 'Assistir documentário' : 'Watch Documentary'}</a>
        {/if}
    </section>
</div>

<style>
    .doc-player {min-height:100vh;background:#111;color:#f5f5f5;padding:24px;}
    .player-card {max-width:900px;margin:24px auto;padding:28px;border:1px solid #cfb87c66;border-radius:18px;text-align:center;}
    .label,.complete,.up-next {color:#cfb87c;}
    .label {letter-spacing:.12em;font-weight:700;text-transform:uppercase;font-size:.8rem;}
    h1 {font-size:clamp(1.6rem,4vw,2.2rem);}
    img {width:190px;height:190px;object-fit:cover;border-radius:50%;border:3px solid #cfb87c;}
    button,a {display:inline-block;min-height:48px;padding:12px 24px;background:#cfb87c;color:#111;border:1px solid #cfb87c;border-radius:999px;font:inherit;font-weight:800;cursor:pointer;text-decoration:none;}
    button:disabled {opacity:.45;cursor:default;}
    button:focus-visible,a:focus-visible {outline:2px solid white;outline-offset:4px;}
    .secondary {background:transparent;color:#cfb87c;}
    .controls {display:flex;flex-wrap:wrap;justify-content:center;gap:12px;}
    progress {width:100%;max-width:420px;accent-color:#cfb87c;}
    .text-button {margin-top:20px;}
    .story-text {text-align:left;line-height:1.8;max-width:760px;margin:24px auto;}
    @media(max-width:560px) {.doc-player {padding:16px;}.player-card {padding:20px 16px;}img {width:140px;height:140px;}}
</style>
