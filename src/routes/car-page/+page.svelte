<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import CarModePlayerPanel from '$lib/components/car/CarModePlayerPanel.svelte';
    import DriveInPlayerPanel from '$lib/components/car/DriveInPlayerPanel.svelte';
    import GuidedPlaybackPanel from '$lib/components/car/GuidedPlaybackPanel.svelte';
    import {derived} from 'svelte/store';
    import {PROGRAM_TYPES} from '$lib/types/program';
    import PhaseBar from '$lib/components/studio/PhaseBar.svelte';
    import CameraPanel from '$lib/components/studio/CameraPanel.svelte';
    import {showCamera} from '$lib/studio/studio.store';
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import {
        playNarrationUrl,
        playNarrationUrlAndWait,
        stopNarration,
        type NarrationTiming
    } from '$lib/audio/narrationPlayer';

    import ShowcasePanel from '$lib/components/studio/ShowcasePanel.svelte';
    import ContextPanel from '$lib/components/studio/ContextPanel.svelte';
    import PlaybackBanner from '$lib/components/studio/PlaybackBanner.svelte';
    import {contextMode} from '$lib/studio/contextMode.store';

    import {get} from 'svelte/store';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';

    import CarModeHeader from '$lib/components/car/CarModeHeader.svelte';
    import type {ResumeState} from '$lib/utils/smartResume';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {
        programHistoryStore,
        markRankPlayed,
        type ProgramKey
    } from '$lib/carmode/programHistory';
    import {goto} from '$app/navigation';
    import {
        startPlaybackPolling,
        stopPlaybackPolling,
        markUserStartedPlayback,
        stopCurrentNarrationPhase,
        continueStoppedNarrationPhase,
        resetNarrationPhaseState,
        resetSpotifyStartState
    } from '$lib/carmode/CarMode.poller';

    import {
        startBedUrl,
        stopBed,
        unlockBedAudio
    } from '$lib/audio/bedPlayer';


    import {
        currentSelection,
        currentTrack,
        tracks,
        currentRank,
        status,
        showNarrationModal,
        playbackPhase,
        elapsed,
        duration,
        progress,
        isPlaying
    } from '$lib/carmode/CarMode.store';

    import {loadForSelection} from '$lib/carmode/CarMode.loader';
    import {signalTrackFinishedApi} from '$lib/api/playbackApi';


    import {buildSelectionFromUrl} from '$lib/carmode/CarMode.url';
    import {saveResumeState} from '$lib/utils/smartResume';
    import {isSafeCollectionsReturnPath} from '$lib/collections/launchCollection';
    import {isSafeArtistSpotlightsReturnPath} from '$lib/artistSpotlights/launchArtistSpotlight';

    import {
        playbackView,
        setPlaybackView,
        togglePlaybackView
    } from '$lib/studio/playbackView.store';


    let collectionNameMap: Record<string, string> = {};

    let collectionGroupNameMap: Record<string, string> = {
        american_heritage_favorites: 'American Heritage Favorites',
        traditional_favorites: 'Traditional Favorites',
        soft_rock_70s_90s: 'Soft Rock 70s–90s',
        music_legends: 'Music Legends',
        music_trends: 'Music Trends',
        stage_and_screen: 'Stage & Screen',
        world_heritage_favorites: 'World Heritage Favorites',
        classical_music: 'Classical Music',
        specialty_mixes: 'Specialty Mixes'
    };


    let lastProgramKey: string | null = null;
    let nextTrackLock = false;
    let artistBioPlayedThisSet = false;
    let guidedReady = false;
    let guidedSpotifyOpened = false;
    let guidedSpotifyReturned = false;
    let guidedSpotifyWindow: Window | null = null;
    let guidedArtistBioPlaying = false;
    let narrationModalInitialMode: 'intro' | 'detail' | 'artist' = 'intro';
    let userStartedPlaybackThisSession = false;
    let playbackStartInFlight = false;
    let guidedPlaybackRunId = 0;
    let activePlayMode: 'guided' | 'auto' | null = null;
    let autoPlayPausedPhase: 'intro' | 'detail' | null = null;
    let guidedPausedPhase: 'intro' | 'detail' | null = null;
    let autoPlayHandoffTrackToken: string | null = null;

    const AUTO_PLAY_BUFFER_SECONDS = 7;
    let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;
    let autoPlayRunId = 0;


    function updateGuidedNarrationTiming(timing: NarrationTiming): void {
        elapsed.set(timing.elapsed);
        duration.set(timing.duration);
        progress.set(timing.progress);
    }

    function resetGuidedNarrationTiming(): void {
        elapsed.set(0);
        duration.set(0);
        progress.set(0);
    }

    type CarDisplayView = 'classic' | 'drive-in';
    let carDisplayView: CarDisplayView = 'drive-in';
    let isSmallScreen = false;
    let carScreen: MediaQueryList | null = null;

    function updateCarLayout() {
        if (!carScreen) return;

        isSmallScreen = carScreen.matches;

        if (isSmallScreen) {
            carDisplayView = 'classic';
        }
    }

    function setCarDisplayView(view: CarDisplayView): void {
        carDisplayView = view;

        if (typeof window !== 'undefined') {
            localStorage.setItem('topspot_car_display', view);
        }
    }

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    type ClientDiagnosticPayload = {
        event: string;
        phase: string | null | undefined;
        mode: string | null | undefined;
        programType: string | null | undefined;
        hasCurrentTrack: boolean;
        trackRank: number | null | undefined;
        decade: string | null | undefined;
        genre: string | null | undefined;
    };

    function sendClientDiagnostic(payload: ClientDiagnosticPayload): void {
        void fetch(`${API_BASE}/playback/client-diagnostic`, {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        }).catch(() => {
            // Diagnostic failures should not affect playback.
        });
    }

    $: settings = $playbackSettingsStore;

    function stopNarrationAudio() {
        // Kill any browser-side narration audio still playing
        const audios = document.querySelectorAll('audio');
        audios.forEach(a => {
            a.pause();
            a.currentTime = 0;
        });
    }

    async function restartProgram() {
        const sel = $currentSelection;
        if (!sel) return;

        await stopPlayback();

        currentTrack.set(null);
        currentRank.set(1);
        artistBioPlayedThisSet = false;
        playedRanks = [];

        await loadForSelection(sel, 1);
    }

    function showMoreInfo() {
        contextMode.set('info');
    }

    function showTrackList() {
        contextMode.set('tracks');
    }


    async function toggleFullscreen() {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    }

    type NarrationKind = 'intro' | 'detail' | 'artist';

    async function previewNarration(kind: NarrationKind) {
        const track = $currentTrack;
        const sel = $currentSelection;
        if (!track || !sel) return;

        stopNarration();

        const language = sel.language ?? 'en';
        const bucket = language === 'ptbr' ? 'audio-ptbr' : `audio-${language}`;

        let url: string | null = null;
        let fallbackUrl: string | undefined;

        if (kind === 'detail' && track.spotifyTrackId) {
            const detailFolder =
                settings.detailLength === 'long' ? 'detail' : 'short-detail';
            const fallbackFolder =
                settings.detailLength === 'long' ? 'short-detail' : 'detail';
            url = `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/${detailFolder}/${track.spotifyTrackId}.mp3`;
            fallbackUrl = `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/${fallbackFolder}/${track.spotifyTrackId}.mp3`;
        }

        if (kind === 'artist') {
            console.log('🎙 preview artist track:', track);
            console.log('🎙 preview artist spotifyArtistId:', track.spotifyArtistId);
        }


        if (kind === 'artist' && track.spotifyArtistId) {
            url = `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/artist/${track.spotifyArtistId}.mp3`;
        }

        if (kind === 'intro') {
            const decade = track.decadeSlug;
            const genre = track.genreSlug;
            const rank = track.rank;

            if (decade && genre && rank) {
                const rankText = String(rank).padStart(2, '0');

                url =
                    `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/intro/${decade}_${genre}_${rankText}.mp3`;
            }
        }

        if (!url) return;

        console.log('🎙 preview url:', url);
        await playNarrationUrl(url, fallbackUrl);
    }

    type StudioAction =
        | 'intro'
        | 'discovery'
        | 'signoff'
        | 'happy-trails';

    async function triggerStudioAction(action: StudioAction): Promise<void> {
        if (get(playbackSettingsStore).playbackMethod === 'guided') {
            status.set('Studio Spotify controls are disabled during Guided Playback.');
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/playback/studio/${action}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    `Studio action "${action}" failed: ${response.status} ${message}`
                );
            }

            console.log(`🎙 Studio action started: ${action}`);
        } catch (error) {
            console.error(`❌ Studio action failed: ${action}`, error);
        }
    }


    function handleKeyDown(e: KeyboardEvent) {
        const target = e.target as HTMLElement | null;

        if (
            target?.tagName === 'INPUT' ||
            target?.tagName === 'TEXTAREA' ||
            target?.isContentEditable
        ) {
            return;
        }


// ============================================================
// Studio Keyboard Shortcuts
//
// Playback Controls
// -----------------
// Space     = Play / Pause
// N         = Next Track
// R         = Restart Current Program
// Esc       = Stop Playback
//
// Narration Preview
// -----------------
// I         = Play Intro Narration
// D         = Play Detail Narration
// A         = Play Artist Narration
//
// Information Panels
// ------------------
// Shift+I   = Show Intro Text
// Shift+D   = Show Detail Text
// Shift+A   = Show Artist Bio
// P         = Show Artist Program Appearances
// T         = Show Track List
//
// Studio Controls
// ---------------
// C         = Toggle Camera
// V         = Toggle Playback View
// B         = Back to Options screen
// F         = Toggle Full Screen
// ============================================================

// ------------------------------------------------------------
// TopSpot40 Studio production shortcuts
// Ctrl+Alt+I = Generic Studio Intro
// Ctrl+Alt+D = Random Liner + Music Discovery
// Ctrl+Alt+O = Outro followed by Happy Trails
// Ctrl+Alt+H = Happy Trails only
// ------------------------------------------------------------
// ============================================================
        if (e.ctrlKey && e.altKey) {

            switch (e.code) {
                case 'KeyI':
                    e.preventDefault();
                    void triggerStudioAction('intro');
                    return;

                case 'KeyD':
                    e.preventDefault();
                    void triggerStudioAction('discovery');
                    return;

                case 'KeyO':
                    e.preventDefault();
                    void triggerStudioAction('signoff');
                    return;

                case 'KeyH':
                    e.preventDefault();
                    void triggerStudioAction('happy-trails');
                    return;
            }
        }

        switch (e.code) {

            // Toggle between Studio View and Playback View
            case 'KeyV':
                e.preventDefault();
                togglePlaybackView();
                break;

            // Show / Hide the camera window
            case 'KeyC':
                e.preventDefault();
                showCamera.update(value => !value);
                contextMode.set('info');
                break;

            // Play the next track in the current sequence
            case 'KeyN':
                e.preventDefault();
                nextTrack();
                break;

            // Play / Pause
            case 'Space':
                e.preventDefault();
                void handlePlayPause();
                break;

            // Intro narration / Intro text
            case 'KeyI':
                e.preventDefault();
                if (e.shiftKey) {
                    contextMode.set('intro');
                } else {
                    void previewNarration('intro');
                }
                break;

            // Detail narration / Detail text
            case 'KeyD':
                e.preventDefault();
                if (e.shiftKey) {
                    contextMode.set('detail');
                } else {
                    void previewNarration('detail');
                }
                break;

            // Artist narration / Artist bio
            case 'KeyA':
                e.preventDefault();
                if (e.shiftKey) {
                    contextMode.set('artist');
                } else {
                    void previewNarration('artist');
                }
                break;

            // Artist program appearances
            case 'KeyP':
                e.preventDefault();
                contextMode.set('appearances');
                break;

            // Track list
            case 'KeyT':
                e.preventDefault();
                contextMode.set('tracks');
                break;

            // Restart the current program from the beginning
            case 'KeyR':
                e.preventDefault();
                void restartProgram();
                break;

            // Return to the TopSpot40 Options page
            case 'KeyB':
                e.preventDefault();
                backToOptions();
                break;

            // Toggle browser full-screen mode
            case 'KeyF':
                e.preventDefault();
                toggleFullscreen();
                break;

            // Emergency stop
            case 'Escape':
                e.preventDefault();
                stopPlayback();
                break;
        }


    }


    const pauseMessage = derived(
        [playbackPhase],
        ([$phase]) => {
            if ($phase !== 'paused') return '';

            return '⏸ Paused — Press ▶ to resume';
        }
    );


    function setNarrationModalOpen(v: boolean): void {
        if (v && !guidedArtistBioPlaying) {
            narrationModalInitialMode = 'intro';
        }

        showNarrationModal.set(v);
    }

    function publicAudioUrl(
        audioKey: { bucket: string; key: string } | null | undefined
    ): string | null {
        if (!audioKey?.bucket || !audioKey.key) return null;

        return `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${audioKey.bucket}/${audioKey.key}`;
    }

    function guidedNarrationUrls(trackObj: CarModeTrack): {
        phase: 'intro' | 'detail' | 'artist';
        url: string;
        fallbackUrl?: string;
    }[] {
        const sel = get(currentSelection);
        const settings = get(playbackSettingsStore);

        if (!sel) return [];

        const language = sel.language ?? 'en';
        const bucket =
            language === 'ptbr'
                ? 'audio-ptbr'
                : `audio-${language}`;

        const result: {
            phase: 'intro' | 'detail' | 'artist';
            url: string;
            fallbackUrl?: string;
        }[] = [];

        if (settings.voices.includes('intro')) {
            let url = publicAudioUrl(trackObj.introKey);

            if (
                !url &&
                sel.mode === 'decade_genre' &&
                trackObj.decadeSlug &&
                trackObj.genreSlug
            ) {
                const rankText = String(trackObj.rank).padStart(2, '0');

                url =
                    `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/` +
                    `${bucket}/intro/${trackObj.decadeSlug}_${trackObj.genreSlug}_${rankText}.mp3`;
            }

            if (!url && sel.mode === 'collection') {
                const collectionSlug =
                    sel.context?.collection_slug ??
                    sel.context?.collectionSlug;

                if (collectionSlug) {
                    const rankText =
                        String(trackObj.rank).padStart(2, '0');

                    url =
                        `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/` +
                        `${bucket}/collections-intros/${collectionSlug}_${rankText}.mp3`;
                }
            }

            if (url) result.push({phase: 'intro', url});
        }

        if (settings.voices.includes('detail')) {
            const detailFolder =
                settings.detailLength === 'long' ? 'detail' : 'short-detail';
            const fallbackFolder =
                settings.detailLength === 'long' ? 'short-detail' : 'detail';
            const url = trackObj.spotifyTrackId
                ? `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/${detailFolder}/${trackObj.spotifyTrackId}.mp3`
                : null;
            const fallbackUrl = trackObj.spotifyTrackId
                ? `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/${fallbackFolder}/${trackObj.spotifyTrackId}.mp3`
                : undefined;

            if (url) result.push({phase: 'detail', url, fallbackUrl});
        }

        if (settings.voices.includes('artist')) {
            const url =
                publicAudioUrl(trackObj.artistKey) ??
                (
                    trackObj.spotifyArtistId
                        ? `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/artist/${trackObj.spotifyArtistId}.mp3`
                        : null
                );

            if (url) result.push({phase: 'artist', url});
        }

        return result;
    }

    function guidedArtistBioUrl(trackObj: CarModeTrack): string | null {
        const sel = get(currentSelection);
        if (!sel) return null;

        const language = sel.language ?? 'en';
        const bucket =
            language === 'ptbr'
                ? 'audio-ptbr'
                : `audio-${language}`;

        return (
            publicAudioUrl(trackObj.artistKey) ??
            (
                trackObj.spotifyArtistId
                    ? `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/artist/${trackObj.spotifyArtistId}.mp3`
                    : null
            )
        );
    }

    async function playGuidedArtistBio(): Promise<void> {
        const track = get(currentTrack);
        const url = track ? guidedArtistBioUrl(track) : null;
        if (!track || !url || guidedArtistBioPlaying) return;

        guidedArtistBioPlaying = true;
        narrationModalInitialMode = 'artist';
        showNarrationModal.set(true);
        playbackPhase.set('artist');

        try {
            await unlockBedAudio();
            await startBedUrl(guidedBedAudioUrl(track));
            await playNarrationUrlAndWait(
                url,
                undefined,
                updateGuidedNarrationTiming
            );
        } finally {
            stopBed();
            resetGuidedNarrationTiming();
            guidedArtistBioPlaying = false;
            showNarrationModal.set(false);
            narrationModalInitialMode = 'intro';
            playbackPhase.set('track');
        }
    }

    function cancelAutoPlayCycle(): number {
        if (autoPlayTimer) {
            clearTimeout(autoPlayTimer);
            autoPlayTimer = null;
        }

        return ++autoPlayRunId;
    }

    async function advanceAutoPlayback(runId: number): Promise<void> {
        if (runId !== autoPlayRunId || activePlayMode !== 'auto') return;

        await continueAutoPlayback();

        if (
            runId !== autoPlayRunId ||
            activePlayMode !== 'auto' ||
            get(isPlaying) ||
            get(playbackPhase) !== 'track'
        ) {
            return;
        }

        const next = get(currentTrack);

        if (!next) {
            activePlayMode = null;
            return;
        }

        console.log(
            'AUTO: opening Spotify for',
            next.trackName,
            next.spotifyTrackId
        );

        handoffAutoPlayTrack(next);
    }

    function startAutoPlayTimer(track: CarModeTrack): void {
        const runId = cancelAutoPlayCycle();

        const durationSeconds =
            track.durationSeconds ??
            (track.durationMs
                ? Math.floor(track.durationMs / 1000)
                : 0);

        if (durationSeconds <= 0) {
            console.warn('Auto Play: no track duration available');
            return;
        }

        const delayMs =
            (durationSeconds + AUTO_PLAY_BUFFER_SECONDS) * 1000;

        console.log(
            `Auto Play: ${track.trackName} — advancing in ${
                durationSeconds + AUTO_PLAY_BUFFER_SECONDS
            }s`
        );

        autoPlayTimer = setTimeout(() => {
            if (runId !== autoPlayRunId) {
                return;
            }

            autoPlayTimer = null;
            void advanceAutoPlayback(runId);
        }, delayMs);
    }

    function stopGuidedArtistBio(): void {
        stopNarration();
        stopBed();
        resetGuidedNarrationTiming();
        guidedArtistBioPlaying = false;
        showNarrationModal.set(false);
        narrationModalInitialMode = 'intro';
        playbackPhase.set('track');
    }

    function guidedBedAudioUrl(trackObj: CarModeTrack): string {
        const sel = get(currentSelection);
        const context = sel?.context;

        const collectionGroup =
            typeof context?.collection_group_slug === 'string'
                ? context.collection_group_slug.trim().toLowerCase()
                : '';

        const genre =
            typeof context?.genre === 'string'
                ? context.genre.trim().toLowerCase()
                : (trackObj.genreSlug ?? '').trim().toLowerCase();

        const bedNumber =
            String(Math.floor(Math.random() * 5) + 1).padStart(2, '0');

        const bedKey = collectionGroup && collectionGroup !== 'all'
            ? `bed-tracks/collection-groups/${collectionGroup}/bed_${bedNumber}.mp3`
            : genre && genre !== 'all'
                ? `bed-tracks/genres/${genre}/bed_${bedNumber}.mp3`
                : `bed-tracks/default/bed_${bedNumber}.mp3`;

        return (
            'https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/' +
            `audio-en/${bedKey}`
        );
    }

    async function startGuidedTrack(
        trackObj: CarModeTrack,
        startPhase: 'intro' | 'detail' = 'intro'
    ): Promise<boolean> {
        const runId = ++guidedPlaybackRunId;

        guidedReady = false;
        guidedSpotifyOpened = false;
        guidedSpotifyReturned = false;

        const token =
            `${trackObj.rankingId ?? trackObj.rank}|${trackObj.spotifyTrackId ?? ''}`;

        const narrations = guidedNarrationUrls(trackObj);
        const narrationStartIndex = narrations.findIndex(
            narration => narration.phase === startPhase
        );
        const narrationSequence =
            startPhase === 'detail'
                ? narrationStartIndex === -1
                    ? []
                    : narrations.slice(narrationStartIndex)
                : narrations;

        isPlaying.set(true);

        if (narrationSequence.length > 0) {
            await unlockBedAudio();

            try {
                await startBedUrl(guidedBedAudioUrl(trackObj));

                if (runId !== guidedPlaybackRunId) return false;

                for (const narration of narrationSequence) {
                    const activeTrack = get(currentTrack);
                    const activeToken = activeTrack
                        ? `${activeTrack.rankingId ?? activeTrack.rank}|${activeTrack.spotifyTrackId ?? ''}`
                        : '';

                    if (
                        activeToken !== token
                        || runId !== guidedPlaybackRunId
                    ) return false;

                    playbackPhase.set(narration.phase);
                    await playNarrationUrlAndWait(
                        narration.url,
                        narration.fallbackUrl,
                        updateGuidedNarrationTiming
                    );

                    if (runId !== guidedPlaybackRunId) return false;
                }
            } finally {
                stopBed();
                resetGuidedNarrationTiming();
            }
        }

        const activeTrack = get(currentTrack);
        const activeToken = activeTrack
            ? `${activeTrack.rankingId ?? activeTrack.rank}|${activeTrack.spotifyTrackId ?? ''}`
            : '';

        if (activeToken !== token || runId !== guidedPlaybackRunId) return false;

        isPlaying.set(false);
        playbackPhase.set('track');
        guidedReady = true;
        return true;
    }

    function handleGuidedReturn(): void {
        if (
            !guidedReady
            || !guidedSpotifyOpened
            || document.visibilityState === 'hidden'
        ) {
            return;
        }

        guidedSpotifyReturned = true;
    }

    function prepareAutoSpotifyWindow(): void {
        try {
            const isMobile =
                /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                // Mobile browsers behave better with a normal tab/window.
                // Reserve it now while we're still inside the user's tap.
                guidedSpotifyWindow = window.open(
                    '/spotify-wait',
                    'topspot40-guided-spotify'
                );

                return;
            }

            // Desktop: keep the compact companion popup.
            const width = 390;
            const height = 520;
            const left = Math.max(
                0,
                window.screen.availWidth - width - 30
            );
            const top = 30;

            guidedSpotifyWindow = window.open(
                '/spotify-wait',
                'topspot40-guided-spotify',
                `popup=yes,width=${width},height=${height},left=${left},top=${top}`
            );

            if (guidedSpotifyWindow) {
                guidedSpotifyWindow.blur();
                window.focus();

                setTimeout(() => {
                    guidedSpotifyWindow?.blur();
                    window.focus();
                }, 150);
            }
        } catch {
            guidedSpotifyWindow = null;
        }
    }

    function openGuidedSpotify() {
        stopGuidedArtistBio();

        const track = get(currentTrack);

        if (!track?.spotifyTrackId) {
            status.set('Spotify link is not available for this track.');
            return;
        }

        guidedSpotifyReturned = false;
        guidedSpotifyOpened = true;

        localStorage.setItem(
            'ts-guided-playback-v1',
            JSON.stringify({
                rankingId: track.rankingId,
                rank: track.rank,
                spotifyTrackId: track.spotifyTrackId,
                trackName: track.trackName,
                artistName: track.artistName,
                openedAt: new Date().toISOString()
            })
        );

        const spotifyUrl =
            `https://open.spotify.com/track/${track.spotifyTrackId}`;

        const isMobile =
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
            // On mobile, use the same browser tab.
            // Android Back should return naturally to Car Mode.
            window.location.href = spotifyUrl;
            return;
        }

        if (
            guidedSpotifyWindow &&
            !guidedSpotifyWindow.closed
        ) {
            guidedSpotifyWindow.location.href = spotifyUrl;
        } else {
            guidedSpotifyWindow = window.open(
                spotifyUrl,
                'topspot40-guided-spotify'
            );
        }

        guidedSpotifyWindow?.focus();
    }

    function closeGuidedSpotifyWindow(): void {
        try {
            if (
                guidedSpotifyWindow
                && !guidedSpotifyWindow.closed
            ) {
                guidedSpotifyWindow.close();
            }
        } catch {
            // The Spotify window may already have been closed
            // manually or may no longer be accessible.
        }

        guidedSpotifyWindow = null;
    }

    async function continueAutoPlayback() {
        try {
            if (
                guidedSpotifyWindow &&
                !guidedSpotifyWindow.closed
            ) {
                guidedSpotifyWindow.location.href =
                    `${window.location.origin}/spotify-wait`;
            }
        } catch {
            console.warn('Auto Play: could not return Spotify window to waiting page');
        }

        guidedReady = false;
        guidedSpotifyOpened = false;
        guidedSpotifyReturned = false;

        await nextTrack(true);
    }

    async function continueGuidedPlayback() {
        closeGuidedSpotifyWindow();

        guidedReady = false;
        guidedSpotifyOpened = false;
        guidedSpotifyReturned = false;

        const sel = get(currentSelection);
        const track = get(currentTrack);
        const isRadioProgram =
            sel?.programType === 'RADIO_DG' ||
            sel?.programType === 'RADIO_COL' ||
            sel?.programType === 'RADIO_ARTIST';

        if (isRadioProgram) {
            await signalTrackFinishedApi({
                rankingId: track?.rankingId ?? null,
                spotifyTrackId: track?.spotifyTrackId ?? null
            });
            return;
        }

        await nextTrack();
    }

    async function skipGuidedTrack() {
        closeGuidedSpotifyWindow();

        guidedReady = false;
        guidedSpotifyOpened = false;
        guidedSpotifyReturned = false;

        const sel = get(currentSelection);
        const track = get(currentTrack);
        const isRadioProgram =
            sel?.programType === 'RADIO_DG' ||
            sel?.programType === 'RADIO_COL' ||
            sel?.programType === 'RADIO_ARTIST';

        if (isRadioProgram) {
            await signalTrackFinishedApi({
                rankingId: track?.rankingId ?? null,
                spotifyTrackId: track?.spotifyTrackId ?? null
            });
            return;
        }

        await nextTrack();
    }

    function returnToGuidedCarPage(): void {
        closeGuidedSpotifyWindow();

        guidedReady = false;
        guidedSpotifyOpened = false;
        guidedSpotifyReturned = false;
        isPlaying.set(false);
        playbackPhase.set('idle');
    }

    async function playTrack(trackObj: CarModeTrack) {
        const sel = $currentSelection;
        if (!sel) return;

        const settings = get(playbackSettingsStore);

        const isRadioProgram =
            sel.programType === 'RADIO_DG' ||
            sel.programType === 'RADIO_COL' ||
            sel.programType === 'RADIO_ARTIST';

        const guidedSupported =
            !isRadioProgram &&
            sel.mode !== 'artist_spotlight';

        if (settings.playbackMethod === 'guided' && guidedSupported) {
            await startGuidedTrack(trackObj);
            return;
        }

        if (sel.mode === 'artist_spotlight' && sel.programType === 'RADIO_ARTIST') {
            console.info('[car-page] playTrack artist_spotlight branch', {
                mode: sel.mode,
                programType: sel.programType,
                genre: sel.context?.genre,
                rank: trackObj.rank
            });
            sendClientDiagnostic({
                event: 'playTrack artist_spotlight branch',
                phase: get(playbackPhase),
                mode: sel.mode,
                programType: sel.programType,
                hasCurrentTrack: Boolean($currentTrack),
                trackRank: trackObj.rank,
                decade: sel.context?.decade,
                genre: sel.context?.genre
            });

            const firstTrack = $tracks[0] as unknown as {
                spotifyArtistId?: string;
                spotify_artist_id?: string;
            };

            const artistParams = new URLSearchParams({
                genre: sel.context?.genre ?? 'ALL',
                tts_language: sel.language ?? 'en',
                play_intro: 'true',
                play_detail: String(settings.voices.includes('detail')),
                play_artist_description: 'true',
                play_track: 'true',
                voice_style: settings.voicePlayMode
            });

            const spotifyArtistId =
                firstTrack.spotifyArtistId ?? firstTrack.spotify_artist_id;

            if (spotifyArtistId) {
                artistParams.set('spotify_artist_id', spotifyArtistId);
            }


            await fetch(
                `${API_BASE}/artist-spotlight/play-radio?${artistParams.toString()}`,
                {method: 'POST', credentials: 'include'}
            );

            return;
        }

        let decadeForPlayback: string | undefined;
        let genreForPlayback: string | undefined;

        if (sel.mode !== 'collection') {
            const programDecade = sel.context?.decade;
            decadeForPlayback =
                programDecade === 'ALL'
                    ? trackObj.decadeSlug ?? programDecade
                    : programDecade;

            const programGenre = sel.context?.genre;
            genreForPlayback =
                programGenre === 'ALL'
                    ? trackObj.genreSlug ?? programGenre
                    : programGenre;
        }

        const payload = {
                track: {
                    track_id: trackObj.id,
                    ranking_id: trackObj.rankingId,
                    spotify_track_id: trackObj.spotifyTrackId,
                    rank: trackObj.rank,
                    track_name: trackObj.trackName,
                    artist_name: trackObj.artistName,
                    intro: trackObj.intro,
                    detail: trackObj.detail
                },
                selection: {
                    ...sel,
                    languages: sel.languages ?? [sel.language],
                    playbackOrder: settings.playbackOrder,
                    voices: settings.voices,
                    voicePlayMode: settings.voicePlayMode,
                    pauseMode: settings.pauseMode,
                    continuous: settings.pauseMode === 'continuous'
                },
                context:
                    sel.mode === 'artist_spotlight'
                        ? {
                            type: 'artist_spotlight',
                            programType: sel.programType,
                            artist_id: sel.context?.artist_id,
                            artist_name: sel.context?.artist_name ?? trackObj.artistName,
                            spotify_artist_id: trackObj.spotifyArtistId,
                            genre: sel.context?.genre ?? trackObj.genreSlug,
                            language: sel.language ?? 'en',
                            play_artist_bio: !artistBioPlayedThisSet
                        }
                        : sel.mode === 'collection'
                            ? (
                                sel.programType === 'RADIO_COL'
                                    ? {
                                        type: 'collection_radio',
                                        collection_group_slug: sel.context?.collection_group_slug
                                    }
                                    : {
                                        type: 'collection',
                                        collection_slug: sel.context?.collection_slug
                                    }
                            )
                            : {
                                type: 'decade_genre',
                                decade: decadeForPlayback,
                                genre: genreForPlayback
                            }
            }
        ;


        if (sel.mode === 'decade_genre' && sel.programType === 'RADIO_DG') {
            console.info('[car-page] playTrack RADIO_DG play-sequence branch', {
                mode: sel.mode,
                programType: sel.programType,
                decade: sel.context?.decade,
                genre: sel.context?.genre,
                rank: trackObj.rank
            });
            sendClientDiagnostic({
                event: 'playTrack RADIO_DG play-sequence branch',
                phase: get(playbackPhase),
                mode: sel.mode,
                programType: sel.programType,
                hasCurrentTrack: Boolean($currentTrack),
                trackRank: trackObj.rank,
                decade: sel.context?.decade,
                genre: sel.context?.genre
            });

            const radioParams = new URLSearchParams({
                decade: sel.context?.decade ?? 'ALL',
                genre: sel.context?.genre ?? 'ALL',
                tts_language: sel.language ?? 'en',
                languages: (sel.languages ?? [sel.language]).join(','),
                play_intro: 'true',
                play_detail: String(settings.voices.includes('detail')),
                play_artist_description: String(settings.voices.includes('artist')),
                play_track: 'true'
            });

            await fetch(
                `${API_BASE}/supabase/decade-genre/play-sequence?${radioParams.toString()}`,
                {method: 'GET', credentials: 'include'}
            );

            return;
        }

        console.info('[car-page] playTrack normal play-track branch', {
            mode: sel.mode,
            programType: sel.programType,
            decade: sel.context?.decade,
            genre: sel.context?.genre,
            rank: trackObj.rank
        });
        sendClientDiagnostic({
            event: 'playTrack normal play-track branch',
            phase: get(playbackPhase),
            mode: sel.mode,
            programType: sel.programType,
            hasCurrentTrack: Boolean($currentTrack),
            trackRank: trackObj.rank,
            decade: sel.context?.decade,
            genre: sel.context?.genre
        });

        const res = await fetch(`${API_BASE}/playback/play-track`, {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (res.ok && sel.mode === 'artist_spotlight') {
            artistBioPlayedThisSet = true;
        }
    }

    async function handleGuidedPlay() {
        activePlayMode = 'guided';
        await handlePlayPause();
    }

    function autoPlayTrackToken(track: CarModeTrack): string {
        return `${track.rankingId ?? track.rank}|${track.spotifyTrackId ?? ''}`;
    }

    function handoffAutoPlayTrack(track: CarModeTrack): void {
        const token = autoPlayTrackToken(track);

        if (
            activePlayMode !== 'auto' ||
            autoPlayHandoffTrackToken === token
        ) {
            return;
        }

        autoPlayHandoffTrackToken = token;
        openGuidedSpotify();
        startAutoPlayTimer(track);
    }

    async function handleAutoPlay() {
        if (!$currentTrack) return;

        if (activePlayMode === 'auto' && get(isPlaying)) {
            const phase = get(playbackPhase);

            guidedPlaybackRunId += 1;
            stopNarration();
            stopBed();
            isPlaying.set(false);
            playbackPhase.set('paused');
            autoPlayPausedPhase = phase === 'detail' ? 'detail' : 'intro';
            return;
        }

        activePlayMode = 'auto';

        const track = $currentTrack;

        if (get(playbackPhase) === 'paused') {
            const pausedPhase = autoPlayPausedPhase;
            autoPlayPausedPhase = null;

            if (pausedPhase === 'detail') {
                handoffAutoPlayTrack(track);
                return;
            }

            if (pausedPhase === 'intro') {
                const completed = await startGuidedTrack(track, 'detail');

                if (completed) {
                    handoffAutoPlayTrack(track);
                }

                return;
            }
        }

        if (autoPlayHandoffTrackToken === autoPlayTrackToken(track)) {
            return;
        }

        const isMobile =
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Desktop reserves the Spotify popup before narration.
        if (!isMobile) {
            prepareAutoSpotifyWindow();
        }

        // Keep Car Mode visible while narration plays.
        const completed = await startGuidedTrack(track);

        if (completed) {
            handoffAutoPlayTrack(track);
        }
    }

    function handleDriveInNext(): void {
        if (activePlayMode !== 'auto') {
            void nextTrack();
            return;
        }

        guidedPlaybackRunId += 1;
        stopNarration();
        stopBed();
        resetGuidedNarrationTiming();
        isPlaying.set(false);
        autoPlayPausedPhase = null;
        autoPlayHandoffTrackToken = null;

        const runId = cancelAutoPlayCycle();
        autoPlayTimer = setTimeout(() => {
            if (runId !== autoPlayRunId) return;

            autoPlayTimer = null;
            void advanceAutoPlayback(runId);
        }, 100);
    }

    async function handlePlayPause() {
        if (!$currentTrack) return;

        const activeSettings = get(playbackSettingsStore);

        if (activeSettings.playbackMethod === 'guided') {
            if (guidedReady) {
                return;
            }

            const sel = get(currentSelection);
            const isRadioProgram =
                sel?.programType === 'RADIO_DG' ||
                sel?.programType === 'RADIO_COL' ||
                sel?.programType === 'RADIO_ARTIST';

            if (isRadioProgram) {
                if (
                    playbackStartInFlight ||
                    userStartedPlaybackThisSession
                ) {
                    return;
                }

                playbackStartInFlight = true;

                try {
                    guidedReady = false;
                    guidedSpotifyOpened = false;
                    guidedSpotifyReturned = false;

                    startPlaybackPolling({guidedLinkOut: true});
                    markUserStartedPlayback();

                    await playTrack($currentTrack);
                    userStartedPlaybackThisSession = true;
                } finally {
                    playbackStartInFlight = false;
                }

                return;
            }

            if (get(isPlaying)) {
                const phase = get(playbackPhase);

                guidedPlaybackRunId += 1;
                stopNarration();
                stopBed();
                isPlaying.set(false);
                playbackPhase.set('paused');
                guidedPausedPhase = phase === 'detail' ? 'detail' : 'intro';
                return;
            }

            if (get(playbackPhase) === 'paused') {
                const pausedPhase = guidedPausedPhase;
                guidedPausedPhase = null;

                if (pausedPhase === 'detail') {
                    resetGuidedNarrationTiming();
                    playbackPhase.set('track');
                    guidedReady = true;
                    return;
                }

                if (pausedPhase === 'intro') {
                    await startGuidedTrack($currentTrack, 'detail');
                    return;
                }
            }

            await startGuidedTrack($currentTrack);
            return;
        }

        const playing = get(isPlaying);

        if (playing) {
            const phase = get(playbackPhase);

            if (phase === 'intro' || phase === 'detail' || phase === 'artist') {
                stopNarrationAudio();

                stopCurrentNarrationPhase({
                    resolvePhase: false,
                    preserveResolve: true
                });

                stopBed();
                isPlaying.set(false);
                playbackPhase.set('paused');
                return;
            }

            await fetch(`${API_BASE}/playback/pause`, {
                method: 'POST',
                credentials: 'include'
            });

            return;
        }

        const phase = get(playbackPhase);

        if (phase === 'paused') {
            continueStoppedNarrationPhase();
            return;
        }

        if (phase === 'track' || phase === 'intro' || phase === 'detail' || phase === 'artist') {
            const res = await fetch(`${API_BASE}/playback/resume`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await res.json().catch(() => null);

            const sel = $currentSelection;

            const isRadio =
                sel?.programType === 'RADIO_DG' ||
                sel?.programType === 'RADIO_COL' ||
                sel?.programType === 'RADIO_ARTIST';

            if (data?.restart_track && $currentTrack && !isRadio) {
                markUserStartedPlayback();
                await playTrack($currentTrack);
            }

            return;
        }

        markUserStartedPlayback();

        const trackToPlay = $currentTrack ?? $tracks[0];

        if (trackToPlay) {
            await playTrack(trackToPlay);
        }
    }

    // Backend owns playback now. Frontend only signals stop.
    async function clearAllPlayback() {
        if (get(playbackSettingsStore).playbackMethod === 'guided') {
            stopNarrationAudio();
            return;
        }

        try {
            await fetch(`${API_BASE}/playback/stop`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch {
            console.warn("Backend stop failed (probably already stopped)");
        }
    }

    async function stopPlayback() {
        resetSpotifyStartState();
        stopNarrationAudio();

        if (get(playbackSettingsStore).playbackMethod === 'guided') {
            return;
        }

        await fetch(`${API_BASE}/playback/stop`, {
            method: 'POST',
            credentials: 'include'
        });
    }

    function resetSelectionPlaybackState(): void {
        stopCurrentNarrationPhase({resolvePhase: false});
        stopBed();
        resetNarrationPhaseState();
        playbackStartInFlight = false;
        userStartedPlaybackThisSession = false;
        currentTrack.set(null);
        tracks.set([]);
        playbackPhase.set('idle');
        isPlaying.set(false);
        elapsed.set(0);
        duration.set(0);
        progress.set(0);
    }

    async function handleJumpToTrack(track: CarModeTrack) {
        await stopPlayback();

        currentTrack.set(track);
        currentRank.set(track.rank);

        markUserStartedPlayback();
        await playTrack(track);
        userStartedPlaybackThisSession = true;
    }

    async function nextTrack(releaseAutoLock = false) {

        if (nextTrackLock) return;
        nextTrackLock = true;

        stopCurrentNarrationPhase({resolvePhase: false});
        stopBed();

        await stopPlayback();

        // resetNarrationPhaseState();

        if (!$currentTrack || $tracks.length === 0) return;

        // await stopPlayback();
        const rankingId = $currentTrack.rankingId;
        const rank = $currentTrack.rank;

// Only block if BOTH are missing (should never happen)
        if (rankingId == null && rank == null) return;

        // track played ranks using rankingId (safer for ALL mode)
        const playedKey = rankingId ?? rank;

        if (playedKey != null && !playedRanks.includes(playedKey)) {
            playedRanks.push(playedKey);
        }

        const sel = $currentSelection;

        if (sel) {
            let key: ProgramKey | null = null;

            if (sel.mode === 'collection') {
                const slug = sel.context?.collection_slug;
                const group = sel.context?.collection_group_slug;

                if (slug && group) {
                    key = `COL|${slug}|${group}` as ProgramKey;
                }
            } else if (sel.mode === 'decade_genre') {
                const decade = $currentTrack.decadeSlug;
                const genre = $currentTrack.genreSlug;

                if (decade && genre) {
                    key = `DG|${decade}|${genre}` as ProgramKey;
                }
            }

            if (key) {
                markRankPlayed(key, $currentTrack.rank);
            }
        }

        const isRadio =
            sel?.programType === 'RADIO_DG' ||
            sel?.programType === 'RADIO_COL' ||
            sel?.programType === 'RADIO_ARTIST';

        if (isRadio) {

        } else {

            const settings = get(playbackSettingsStore);

            let orderedTracks = [...$tracks];

            if (settings.playbackOrder === 'down') {
                orderedTracks.sort((a, b) => b.rank - a.rank);
            } else if (settings.playbackOrder === 'up') {
                orderedTracks.sort((a, b) => a.rank - b.rank);
            }

            const currentIndex =
                rankingId != null
                    ? orderedTracks.findIndex(t => t.rankingId === rankingId)
                    : orderedTracks.findIndex(t => t.rank === rank);

            if (currentIndex === -1) return;

            let next =
                settings.skipPlayed
                    ? orderedTracks
                        .slice(currentIndex + 1)
                        .find(t => !playedRanks.includes(t.rank))
                    : null;

            if (!next) {
                next = orderedTracks[(currentIndex + 1) % orderedTracks.length];
            }

            currentRank.set(next.rank);
            currentTrack.set(next);

            await new Promise(r => setTimeout(r, 50));

            markUserStartedPlayback();
            const playback = playTrack(next);
            if (releaseAutoLock) {
                nextTrackLock = false;
            }
            await playback;
            userStartedPlaybackThisSession = true;
        }

        if (!releaseAutoLock) {
            setTimeout(() => {
                nextTrackLock = false;
            }, 500);
        }
    }

    async function prevTrack() {
        if (!$currentTrack || $tracks.length === 0) return;

        stopNarrationAudio();
        stopCurrentNarrationPhase();
        stopBed();

        await stopPlayback();

        const rankingId = $currentTrack.rankingId;
        if (rankingId == null) return;

        const currentIndex =
            $tracks.findIndex(t => t.rankingId === rankingId);

        if (currentIndex === -1) return;

        const prevIndex = (currentIndex - 1 + $tracks.length) % $tracks.length;
        const prev = $tracks[prevIndex];

        currentRank.set(prev.rank);
        currentTrack.set(prev);

        await new Promise(r => setTimeout(r, 50));

        markUserStartedPlayback();
        await playTrack(prev);
        userStartedPlaybackThisSession = true;
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    const toTitleCase = (text: string | null | undefined): string =>
        text ? text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1)) : '';


    let playedRanks: number[] = [];

    $: console.log('showCamera =', $showCamera);

    $: {
        const sel = $currentSelection;

        if (!sel) {
            lastProgramKey = null;
            playedRanks = [];
        } else {
            let key: ProgramKey | null = null;

            if (sel.mode === 'collection') {
                const slug = sel.context?.collection_slug;
                const group = sel.context?.collection_group_slug;

                if (slug && group) {
                    key = `COL|${slug}|${group}` as ProgramKey;
                }
            } else {
                const decade = sel.context?.decade;
                const genre = sel.context?.genre;

                if (decade && genre) {
                    key = `DG|${decade}|${genre}` as ProgramKey;
                }
            }

            if (key !== lastProgramKey) {
                lastProgramKey = key;
            }

            const history = $programHistoryStore.find(p => p.key === key);
            playedRanks = history?.playedRanks ?? [];
        }
    }

    const isRadioMode =
        $currentSelection?.mode === 'decade_genre' &&
        $currentSelection?.context?.decade === 'ALL';

    $: uiDecade =
        $currentSelection?.mode === 'decade_genre'
            ? (
                isRadioMode
                    ? ($currentTrack?.decadeName ?? '')
                    : ($currentTrack?.decadeName ?? toTitleCase($currentSelection.context?.decade ?? ''))
            )
            : collectionNameMap[$currentSelection?.context?.collection_slug ?? ''] ??
            toTitleCase($currentSelection?.context?.collection_slug ?? '');

    $: uiGenre =
        $currentSelection?.mode === 'decade_genre'
            ? (
                isRadioMode
                    ? ($currentTrack?.genreName ?? '')
                    : ($currentTrack?.genreName ?? toTitleCase($currentSelection.context?.genre ?? ''))
            )
            : '';

    $: bannerTitle =
        headerMode === 'artist_spotlight'
            ? ($currentSelection?.context?.artist_name ?? $currentTrack?.artistName ?? '')
            : uiDecade;

    $: bannerSubtitle =
        headerMode === 'collection'
            ? (
                collectionGroupNameMap[
                $currentSelection?.context?.collection_group_slug ?? ''
                    ] ?? ''
            )
            : headerMode === 'artist_spotlight'
                ? 'Artist Spotlight'
                : uiGenre;

    $: driveInProgramTitle =
        headerMode === 'collection'
            ? uiDecade
            : headerMode === 'artist_spotlight'
                ? `${bannerTitle} Spotlight`
                : `${uiDecade} ${uiGenre}`.trim();


    $: headerMode =
        $currentSelection?.mode === 'decade_genre' ||
        $currentSelection?.mode === 'collection' ||
        $currentSelection?.mode === 'artist_spotlight'
            ? $currentSelection.mode
            : 'decade_genre';


    function backToOptions() {
        if ($currentSelection && $currentTrack) {

            const settings = get(playbackSettingsStore);

            const resume: ResumeState = {
                // program identity (from selection)
                mode: $currentSelection.mode,
                context: $currentSelection.context ?? {},
                language: $currentSelection.language,
                languages: $currentSelection.languages ?? [$currentSelection.language],
                // progress (from selection)
                startRank: $currentSelection.startRank,
                endRank: $currentSelection.endRank,
                currentRank: $currentRank,

                // playback behavior (from settings store)
                playbackOrder: settings.playbackOrder,
                pauseMode: settings.pauseMode,
                voices: settings.voices,
                skipPlayed: settings.skipPlayed,

            };

            // ⭐ THIS LINE WAS MISSING
            saveResumeState(resume);
        }

        const currentParams = new URLSearchParams(window.location.search);
        const mode = currentParams.get('mode');
        const decade = currentParams.get('decade');
        const language = currentParams.get('language') ?? 'en';
        const returnTo = currentParams.get('returnTo');

        if (isSafeCollectionsReturnPath(returnTo) || isSafeArtistSpotlightsReturnPath(returnTo)) {
            window.location.href = returnTo;
        } else if (mode === 'nostalgia' && decade) {
            const genreParams = new URLSearchParams({
                decade,
                language
            });

            window.location.href = `/journey-prototype/genre?${genreParams.toString()}`;
        } else {
            window.location.href = '/options-v4';
        }
    }


    async function handleAutoNextTrack() {

        await new Promise(r => setTimeout(r, 300)); // 🔥 try 300–500ms

        await nextTrack();
    }

    function handleGuidedTrackReady(event: Event): void {
        const customEvent = event as CustomEvent<{ spotifyTrackId?: string }>;
        const spotifyTrackId = customEvent.detail?.spotifyTrackId;
        const track = get(currentTrack);

        if (
            !spotifyTrackId ||
            !track?.spotifyTrackId ||
            track.spotifyTrackId !== spotifyTrackId
        ) {
            return;
        }

        guidedSpotifyOpened = false;
        guidedSpotifyReturned = false;
        guidedReady = true;

        isPlaying.set(false);
        playbackPhase.set('track');
    }


    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    onMount(async () => {
        console.info('[car-page] build marker main@3ce2b0b mini-player-tap-diagnostic');

        carScreen = window.matchMedia('(max-width: 1199px)');
        updateCarLayout();
        carScreen.addEventListener('change', updateCarLayout);

        const savedCarDisplay = localStorage.getItem('topspot_car_display');

        if (isSmallScreen) {
            carDisplayView = 'classic';
        } else if (
            savedCarDisplay === 'classic' ||
            savedCarDisplay === 'drive-in'
        ) {
            carDisplayView = savedCarDisplay;
        }


        window.addEventListener('keydown', handleKeyDown);

        document.addEventListener(
            'visibilitychange',
            handleGuidedReturn
        );
        window.addEventListener(
            'focus',
            handleGuidedReturn
        );
        const mountedSettings = get(playbackSettingsStore);

        if (mountedSettings.playbackMethod === 'automatic') {
            // Automatic Playback keeps the existing backend transport.
            try {
                await fetch(`${API_BASE}/playback/reset`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (err) {
                console.warn('⚠️ Backend reset failed (continuing anyway):', err);
            }

            startPlaybackPolling();
        } else {
            // Guided Playback owns narration and Spotify handoff in the browser.
            resetNarrationPhaseState();
            playbackPhase.set('idle');
            isPlaying.set(false);
        }

        window.addEventListener('ts-next-track', handleAutoNextTrack);
        window.addEventListener('ts-guided-track-ready', handleGuidedTrackReady);


        const url = new URL(window.location.href);
        const hasParams = url.searchParams.toString().length > 0;

        setPlaybackView(
            url.searchParams.get('view') === 'studio'
                ? 'studio'
                : 'car'
        );

        let sel;
        let initialRank: number | null = null;

        if (hasParams) {
            sel = buildSelectionFromUrl(url);

            // 🔥 Normalize programType based on selection
            if (sel.mode === 'decade_genre') {
                const isRadio =
                    sel.context?.decade === 'ALL';

                sel.programType = isRadio
                    ? PROGRAM_TYPES.RADIO_DG
                    : PROGRAM_TYPES.PROGRAM_DG;
            }

            if (sel.mode === 'collection') {
                const collectionGroup =
                    sel.context?.collection_group_slug ??
                    sel.context?.collectionGroupSlug ??
                    sel.context?.collection_group;

                const modeParam = url.searchParams.get('mode');

                const isRadio =
                    modeParam === 'radio_collections' ||
                    collectionGroup === 'ALL';

                sel.programType = isRadio
                    ? PROGRAM_TYPES.RADIO_COL
                    : PROGRAM_TYPES.PROGRAM_COL;

            }

            console.log('🎯 URL selection before currentSelection.set:', sel);
            resetSelectionPlaybackState();
            currentSelection.set(sel);

            const cr = url.searchParams.get('currentRank');
            initialRank = cr ? Number(cr) : null;
        } else {
            // If we got here without params, treat it as invalid navigation.
            // This prevents stale store state from causing wrong modes.
            console.warn('⚠️ Car page opened without params — redirecting to Options');
            await goto('/options-v4');
            return;
        }


        try {
            const normalized = await loadCatalogOnce();

            const map: Record<string, string> = {};
            for (const group of normalized.collectionGroups ?? []) {
                for (const item of group.items) {
                    map[item.slug] = item.name;
                }
            }

            collectionNameMap = map;
        } catch (err) {
            console.error('Failed to load collection names:', err);
        }

        if (!sel) {
            console.error('No selection available for loadForSelection');
            return;
        }
        await loadForSelection(sel, initialRank);
        playbackStartInFlight = false;
        userStartedPlaybackThisSession = false;
        isPlaying.set(false);
        playbackPhase.set('idle');
        elapsed.set(0);
        duration.set(0);
        progress.set(0);

        /// ─────────────────────────────────────────────
        // Prepare Spotify playback (warmup)
        // ─────────────────────────────────────────────

    });


    onDestroy(() => {
        carScreen?.removeEventListener('change', updateCarLayout);

        window.removeEventListener(
            'keydown',
            handleKeyDown
        );
        window.removeEventListener(
            'keydown',
            handleKeyDown
        );

        document.removeEventListener(
            'visibilitychange',
            handleGuidedReturn
        );

        window.removeEventListener(
            'focus',
            handleGuidedReturn
        );

        window.removeEventListener(
            'ts-next-track',
            handleAutoNextTrack
        );
        window.removeEventListener(
            'ts-guided-track-ready',
            handleGuidedTrackReady
        );

        stopPlaybackPolling();
        void clearAllPlayback();
    });

</script>

<PublicJourneyHeader language={$currentSelection?.language ?? 'en'}/>


<div
        class:car-mode-root={$playbackView === 'car'}
        class:studio-view-root={$playbackView === 'studio'}
>
    {#if $playbackView === 'studio'}
        <div class="studio-shell">

            <div class="studio-program-banner">
                <h1>{bannerTitle}</h1>
                {#if bannerSubtitle}
                    <div class="studio-program-subtitle">{bannerSubtitle}</div>
                {/if}
            </div>

            <PhaseBar/>

            <main class="studio-grid">

                <ShowcasePanel/>

                <aside class="studio-side">
                    <ContextPanel/>

                    {#if $showCamera}
                        <div class="studio-feature-slot">
                            <CameraPanel/>
                        </div>
                    {/if}
                </aside>

            </main>

            <PlaybackBanner
                    trackName={$currentTrack?.trackName}
                    artistName={$currentTrack?.artistName}
                    yearReleased={$currentTrack?.yearReleased}
                    rank={$currentTrack?.rank}
                    totalTracks={$tracks.length}
                    progress={$progress}
            />

        </div>

    {:else}

        {#if $currentSelection}
            <CarModeHeader
                    decade={uiDecade}
                    genre={uiGenre}
                    collection={headerMode === 'collection' ? uiDecade : undefined}
                    mode={headerMode}
                    programType={$currentSelection.programType}
                    languages={$currentSelection.languages ?? [$currentSelection.language]}
                    voices={settings.voices}
                    playbackOrder={$currentSelection.playbackOrder}
                    voicePlayMode={settings.voicePlayMode}
                    pauseMode={settings.pauseMode}
                    skipPlayed={settings.skipPlayed}
                    categoryMode="single"
                    compact={carDisplayView === 'drive-in'}
            />
        {/if}

        {#if $currentTrack}

            {#if carDisplayView === 'drive-in'}
                <DriveInPlayerPanel
                        currentTrack={$currentTrack}
                        tracks={$tracks}
                        isPlaying={$isPlaying}
                        elapsed={$elapsed}
                        duration={$duration}
                        progress={$progress}
                        phase={$playbackPhase}
                        programTitle={driveInProgramTitle}
                        showNarrationModal={$showNarrationModal}
                        {narrationModalInitialMode}
                        setShowNarrationModal={setNarrationModalOpen}
                        onPrev={prevTrack}
                        onNext={handleDriveInNext}
                        onJumpToTrack={handleJumpToTrack}
                        onPlayPause={handleGuidedPlay}
                        activePlayMode={activePlayMode}
                        onAutoPlay={handleAutoPlay}
                        onBackToOptions={backToOptions}
                        onUseClassicView={() => setCarDisplayView('classic')}
                />
            {:else}
                {#if !isSmallScreen}
                    <div class="classic-view-toolbar">
                        <button
                                type="button"
                                on:click={() => setCarDisplayView('drive-in')}
                        >
                            🎞 Drive-In View
                        </button>
                    </div>
                {/if}

                <CarModePlayerPanel
                        currentTrack={$currentTrack}
                        tracks={$tracks}
                        isPlaying={$isPlaying}
                        elapsed={$elapsed}
                        duration={$duration}
                        progress={$progress}
                        phase={$playbackPhase}
                        showNarrationModal={$showNarrationModal}
                        {narrationModalInitialMode}
                        setShowNarrationModal={setNarrationModalOpen}
                        onPrev={prevTrack}
                        onNext={nextTrack}
                        onJumpToTrack={handleJumpToTrack}
                        onPlayPause={handleGuidedPlay}
                        activePlayMode={activePlayMode}
                        onBackToOptions={backToOptions}
                />
            {/if}

            {#if settings.playbackMethod === 'guided' && guidedReady && activePlayMode !== 'auto'}
                <GuidedPlaybackPanel
                        track={$currentTrack}
                        opened={guidedSpotifyOpened}
                        returned={guidedSpotifyReturned}
                        hasArtistBio={guidedArtistBioUrl($currentTrack) !== null}
                        artistBioPlaying={guidedArtistBioPlaying}
                        onPlayArtistBio={playGuidedArtistBio}
                        onStopArtistBio={stopGuidedArtistBio}
                        onOpenSpotify={openGuidedSpotify}
                        onContinue={continueGuidedPlayback}
                        onSkip={skipGuidedTrack}
                        onBackToCar={returnToGuidedCarPage}
                />
            {/if}


        {:else}
            <p class="text-gray-400 italic text-center mt-10">{$status}</p>
        {/if}

        {#if $pauseMessage}
            <div class="pause-banner">
                {$pauseMessage}
            </div>
        {/if}

    {/if}


</div>

<style>

    .car-mode-root {
        min-height: 100vh;
        width: 100%;
        background: radial-gradient(
                circle at top,
                #1a1a1f 0%,
                #0e0e11 45%,
                #08080a 100%
        );
        color: #fff;
    }

    .classic-view-toolbar {
        display: flex;
        justify-content: flex-end;
        padding: 10px 18px 0;
    }

    .classic-view-toolbar button {
        border: 1px solid rgba(207, 184, 124, 0.65);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.72);
        color: #e8d7a7;
        cursor: pointer;
        padding: 8px 15px;
        font-weight: 700;
    }

    .classic-view-toolbar button:hover,
    .classic-view-toolbar button:focus-visible {
        border-color: #22c55e;
        color: #42df78;
    }

    .pause-banner {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);

        background: rgba(0, 0, 0, 0.7);
        color: white;

        padding: 10px 16px;
        border-radius: 10px;

        font-size: 14px;
    }

    .pause-banner {
        opacity: 0;
        animation: fadeIn 0.3s forwards;
    }

    @keyframes fadeIn {
        to {
            opacity: 1;
        }
    }

    .studio-view-root {
        min-height: 100vh;
        width: 100%;
        background: #050505;
        color: #fff;
    }

    .studio-placeholder h1 {
        font-size: clamp(2.5rem, 6vw, 5rem);
        line-height: 1;
        margin: 0 0 1rem;
    }

    .studio-placeholder p {
        opacity: 0.75;
        margin-bottom: 2rem;
    }

    .studio-placeholder a {
        color: #cfb87c;
    }

    .studio-shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .studio-grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
        gap: 1rem;
        padding: 0.75rem 2rem 1.25rem;
    }

    .studio-side {
        display: grid;
        grid-template-rows: 1fr auto;
        gap: 0.5rem; /* was probably 1rem or 1.25rem */
    }

    .studio-program-banner {
        border-bottom: 1px solid rgba(207, 184, 124, 0.35);
        padding: 0.55rem 2rem 0.5rem;
        text-align: center;
    }

    .studio-program-banner h1 {
        margin: 0;
        color: #fff;
        font-size: clamp(2rem, 3.5vw, 3.2rem);
        font-weight: 800;
        line-height: 1;
    }

    .studio-program-subtitle {
        margin-top: 0.4rem;
        color: #cfb87c;
        font-size: clamp(0.9rem, 1.5vw, 1.15rem);
        font-weight: 500;
        letter-spacing: 0.03em;
        line-height: 1.2;
    }

    .studio-feature-slot {
        height: 180px;
        width: 100%;
        overflow: hidden;

        display: flex;
        justify-content: center;
        align-items: flex-start;

        padding-top: 8px; /* adjust to taste */
    }

</style>




