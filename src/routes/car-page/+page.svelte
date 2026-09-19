<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import CarModePlayerPanel from '$lib/components/car/CarModePlayerPanel.svelte';
    import DriveInPlayerPanel from '$lib/components/car/DriveInPlayerPanel.svelte';
    import GuidedPlaybackPanel from '$lib/components/car/GuidedPlaybackPanel.svelte';
    import AudioDiagnosticPanel from '$lib/components/car/AudioDiagnosticPanel.svelte';
    import ReportProblemModal from '$lib/components/car/ReportProblemModal.svelte';
    import {
        buildContentIssueContext,
        getReportDeviceType,
        type ContentIssueContext,
        type ContentIssueType
    } from '$lib/reporting/contentIssue';
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
    import {classicViewCopy} from '$lib/carmode/classicViewLabels';
    import type {ResumeState} from '$lib/utils/smartResume';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {
        cancelAllCarModeAutoPlay,
        createCarModeAutoPlay
    } from '$lib/carmode/CarModeAutoPlay';
    import {createCarModeNavigation} from '$lib/carmode/CarModeNavigation';
    import {
        buildProgramStartedProperties,
        createProgramStartedTracker
    } from '$lib/carmode/CarModeAnalytics';
    import {createCarModeNarration} from '$lib/carmode/CarModeNarration';
    import {artistStoryIdentity, shouldPlayArtistStory} from '$lib/carmode/ArtistStories';
    import {createCarModeSpotify} from '$lib/carmode/CarModeSpotify';
    import posthog from 'posthog-js';
    import { captureProgramStarted, captureSpotifyOpen } from '$lib/analytics/posthog';
    import {
        programHistoryStore,
        type ProgramKey
    } from '$lib/carmode/programHistory';
    import {goto} from '$app/navigation';
    import {isRadioExperienceDestination} from '$lib/journey/experienceMode';
    import {
        startPlaybackPolling,
        stopPlaybackPolling,
        markUserStartedPlayback,
        stopCurrentNarrationPhase,
        continueStoppedNarrationPhase,
        resetNarrationPhaseState,
        resetSpotifyStartState,
        setExternalRadioTrackPaused,
        setExternalRadioSpotifyHandoffReady
    } from '$lib/carmode/CarMode.poller';

    import {resetPlaybackProgress} from '$lib/utils/resetPlaybackState';
    import {
        startBedUrl,
        stopBed,
        unlockBedAudio
    } from '$lib/audio/bedPlayer';
    import {
        publicAudioUrl,
        resolveSequenceNarrationUrls
    } from '$lib/audio/sequenceNarration';
    import {
        audioDebugEnabled,
        isAudioDebugEnabled,
        logAudioDebug
    } from '$lib/audio/audioDebug';


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
    import {
        fetchPlaybackStatus, resetPlaybackApi, sendPlaybackDiagnostic,
        signalTrackFinishedApi, startGuestPlaybackSession, startRadioSequence,
        updateRadioNarrationPolicy
    } from '$lib/api/playbackApi';
    import {stopPlaybackApi} from '$lib/api/playbackApi';
    import {normalizePlaybackContext} from '$lib/utils/normalizePlaybackContext';
    import {buildFallbackPlaybackTrack} from '$lib/utils/buildPlaybackTrack';
    import {
        buildPlaybackSelection,
        playbackTrackRequestInit
    } from '$lib/carmode/playbackLaunch';
    import {
        appendNostalgiaRadioGenres,
        isGeneratedNostalgiaRadioGenreAllowed,
        nostalgiaRadioStationLabel,
        selectedNostalgiaRadioGenres
    } from '$lib/journey/nostalgiaRadioGenres';


    import {buildSelectionFromUrl} from '$lib/carmode/CarMode.url';
    import {saveResumeState} from '$lib/utils/smartResume';
    import {isSafeCollectionsReturnPath} from '$lib/collections/launchCollection';
    import {isSafeArtistSpotlightsReturnPath} from '$lib/artistSpotlights/launchArtistSpotlight';
    import {
        buildCarModePreferencesUrl,
        findReturnedCarModeTrack,
        isChangedCarModePreferencesReturn,
        isUnchangedCarModePreferencesReturn
    } from '$lib/carmode/CarModePreferencesReturn';

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
    let artistBioPlayedThisSet = false;
    let artistStoriesEnabled = false;
    let artistStoriesPlayed = new Set<string>();
    let guidedSpotifyOpenedThisProgram = false;
    let guidedReady = false;
    let narrationModalInitialMode: 'intro' | 'detail' | 'artist' = 'intro';
    let userStartedPlaybackThisSession = false;
    let playbackStartInFlight = false;
    let activePlayMode: 'guided' | 'auto' | null = null;
    let preservePlaybackForPreferences = false;
    let lastAudioDebugState = '';

    const programStartedTracker = createProgramStartedTracker({
        capture: properties => captureProgramStarted(posthog, properties),
        alreadyStarted: false
    });

    function captureProgramStartedOnce(): void {
        const selection = get(currentSelection);
        if (!selection) return;

        const settings = get(playbackSettingsStore);

        programStartedTracker.captureOnce(
            buildProgramStartedProperties(
                selection,
                settings.playbackMethod
            )
        );
    }
    let reportContext: ContentIssueContext | null = null;
    let reportInitialIssueType: ContentIssueType | undefined;

    function openReportProblem(initialIssueType?: ContentIssueType): void {
        const track = get(currentTrack);
        if (!track) {
            return;
        }

        const settings = get(playbackSettingsStore);
        const playbackMode = activePlayMode ?? (
            settings.playbackMethod === 'guided' ? 'guided' : 'auto'
        );

        reportInitialIssueType = initialIssueType;
        reportContext = buildContentIssueContext({
            track,
            selection: get(currentSelection),
            playbackPhase: get(playbackPhase),
            playbackMode,
            deviceType: getReportDeviceType(),
            route: typeof window === 'undefined' ? '/car-page' : window.location.pathname,
            timestamp: new Date().toISOString()
        });
        showNarrationModal.set(false);
    }

    function openNarrationReport(mode: 'intro' | 'detail' | 'artist'): void {
        openReportProblem(
            mode === 'intro'
                ? 'intro_content'
                : mode === 'detail'
                    ? 'detail_content'
                    : 'artist_bio_content'
        );
    }

    const AUTO_PLAY_BUFFER_SECONDS = 5;


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
    let interactiveRadioTest = false;
    let interactiveRadioBlocked = false;
    let radioStartPending = false;
    let radioAdvancePending = false;
    // While radio is active, preference changes are queued to the backend and
    // applied only when its next set begins.
    let radioNarrationPolicyActive = false;
    let radioNarrationPolicyUpdate: Promise<void> = Promise.resolve();
    let radioCompletionSpotifyTrackId: string | null = null;
    let interruptedRadioTrack: CarModeTrack | null = null;
    let radioInterruptedResumePending = false;
    let radioSpotifyRetryTrack: CarModeTrack | null = null;
    let radioChangeMusicInProgress = false;
    let openGuidedTrackList = false;
    let guidedReturnActionInProgress = false;
    let carScreen: MediaQueryList | null = null;

    function updateCarLayout() {
        if (!carScreen) return;

        isSmallScreen = carScreen.matches;

        if (isSmallScreen) {
            carDisplayView = 'classic';
        }
    }

    function setCarDisplayView(view: CarDisplayView): void {
        if (interactiveRadioTest && view !== 'drive-in') return;
        carDisplayView = view;

        if (typeof window !== 'undefined') {
            localStorage.setItem('topspot_car_display', view);
        }
    }

    import {BACKEND_API_BASE} from '$lib/api/backendBase';
    const API_BASE = BACKEND_API_BASE;

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
        void sendPlaybackDiagnostic(payload).catch(() => {
            // Diagnostic failures should not affect playback.
        });
    }

    $: settings = $playbackSettingsStore;
    $: if (isAudioDebugEnabled()) {
        const track = $currentTrack;
        const state = `${activePlayMode ?? 'none'}|${guidedReady}|${$isPlaying}|${$playbackPhase}|${track?.rankingId ?? track?.rank ?? 'none'}`;
        if (state !== lastAudioDebugState) {
            lastAudioDebugState = state;
            logAudioDebug('Guided playback state', {
                mode: activePlayMode ?? 'none',
                guidedReady,
                isPlaying: $isPlaying,
                playbackPhase: $playbackPhase,
                trackRank: track?.rank ?? null,
                trackName: track?.trackName ?? null,
                artistName: track?.artistName ?? null
            });
        }
    }

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
        artistStoriesEnabled = false;
        artistStoriesPlayed = new Set<string>();
        navigation.resetPlayedRanks();

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
        const narrationUrls = resolveSequenceNarrationUrls(
            track,
            language,
            settings.detailLength
        );

        let url: string | null = null;
        let fallbackUrl: string | undefined;

        if (kind === 'detail') {
            url = narrationUrls.detail;
            fallbackUrl = narrationUrls.detailFallback;
        }

        if (kind === 'artist') {
            console.log('🎙 preview artist track:', track);
            console.log('🎙 preview artist spotifyArtistId:', track.spotifyArtistId);
        }


        if (kind === 'artist' && track.spotifyArtistId) {
            url = `https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/${bucket}/artist/${track.spotifyArtistId}.mp3`;
        }

        if (kind === 'intro') {
            url = narrationUrls.intro;
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
        if (v) narrationModalInitialMode = 'intro';

        showNarrationModal.set(v);
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
        const bucket = language === 'ptbr' ? 'audio-ptbr' : `audio-${language}`;
        const narrationUrls = resolveSequenceNarrationUrls(
            trackObj,
            language,
            settings.detailLength
        );

        const result: {
            phase: 'intro' | 'detail' | 'artist';
            url: string;
            fallbackUrl?: string;
        }[] = [];

        if (settings.voices.includes('intro')) {
            let url = narrationUrls.intro;

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

        if (settings.voices.includes('detail') && settings.detailLength !== 'off') {
            const url = narrationUrls.detail;
            const fallbackUrl = narrationUrls.detailFallback;

            if (url) result.push({phase: 'detail', url, fallbackUrl});
        }

        const artistBioUrl = guidedArtistBioUrl(trackObj);
        if (shouldPlayArtistStory(
            artistStoriesEnabled,
            artistStoriesPlayed,
            trackObj,
            artistBioUrl !== null
        ) && artistBioUrl) {
            result.push({phase: 'artist', url: artistBioUrl});
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

    const spotify = createCarModeSpotify({
        getLanguage: () => $currentSelection?.language ?? 'en',
        getGuidedReady: () => guidedReady,
        setStatus: message => status.set(message),
        captureSpotifyOpen: track => {
            const selection = get(currentSelection);
            const context = selection?.context;
            captureSpotifyOpen(posthog, {
                mode: selection?.mode ?? null,
                language: selection?.language ?? null,
                decade: context?.decade ?? track.decadeSlug ?? null,
                genre: context?.genre ?? track.genreSlug ?? null,
                collection: context?.collection ?? context?.collection_slug ?? track.collection_name ?? null,
                track_id: track.id ?? null,
                ranking_id: track.rankingId,
                track_rank: track.rank,
                spotify_track_id: track.spotifyTrackId ?? null,
                action_source: activePlayMode === 'auto' ? 'auto_play' : 'guided_play'
            });
        }
    });
    const spotifyState = spotify.state;

    const narration = createCarModeNarration({
        getCurrentTrack: () => get(currentTrack),
        getNarrations: guidedNarrationUrls,
        getBedUrl: guidedBedAudioUrl,
        unlockBed: unlockBedAudio,
        startBed: startBedUrl,
        stopBed,
        playNarration: playNarrationUrlAndWait,
        stopNarration,
        updateTiming: updateGuidedNarrationTiming,
        resetTiming: resetGuidedNarrationTiming,
        getPlaybackPhase: () => get(playbackPhase),
        setPlaybackPhase: phase => playbackPhase.set(phase),
        setIsPlaying: playing => isPlaying.set(playing),
        resetGuidedReadyState: () => (guidedReady = false),
        setGuidedReady: ready => (guidedReady = ready)
        ,onNarrationStart: (phase, track) => {
            if (phase === 'artist') {
                artistStoriesPlayed = new Set([
                    ...artistStoriesPlayed,
                    artistStoryIdentity(track)
                ]);
            }
        }
    });

    async function startGuidedTrack(
        trackObj: CarModeTrack,
        startPhase: 'intro' | 'detail' = 'intro'
    ): Promise<boolean> {
        logAudioDebug('Guided narration start requested', {
            trackRank: trackObj.rank,
            trackName: trackObj.trackName,
            artistName: trackObj.artistName,
            narrationPhase: startPhase
        });
        spotify.reset();
        const started = await narration.start(trackObj, startPhase);
        logAudioDebug('Guided narration start completed', {
            started,
            playbackPhase: get(playbackPhase),
            trackRank: trackObj.rank
        });
        return started;
    }

    function openGuidedSpotify(): boolean {
        const track = get(currentTrack);
        const opened = spotify.open(track);

        if (opened) {
            guidedSpotifyOpenedThisProgram = true;
        }

        return opened;
    }

    async function continueAutoPlayback() {
        const helperReset = spotify.returnToWaitingPage();
        const backendRadio = isBackendRadioAutoHandoffSelection();
        const nostalgiaRadio = isPrivateNostalgiaRadioSelection();
        console.info('[car-mode] backend radio next-track cycle', {
            programType: get(currentSelection)?.programType ?? null,
            nostalgiaRadio,
            firstTimerCompleted: true,
            nextTrackCycleStarted: backendRadio,
            helperResetAttempted: true,
            helperResetSucceeded: helperReset,
            helperWindowPresent: helperReset,
            phase: get(playbackPhase),
            spotifyId: get(currentTrack)?.spotifyTrackId ?? null,
            rejectionReason: helperReset || spotify.isMobile()
                ? null
                : 'helper-window-unavailable'
        });

        guidedReady = false;
        spotify.reset();

        if (backendRadio) {
            if (!spotify.isMobile() && !helperReset) {
                radioSpotifyRetryTrack = get(currentTrack);
                activePlayMode = null;
                status.set('Spotify window is unavailable. Press Auto Play to try again.');
                return;
            }
            await advancePrivateRadioTrack();
            // The poller consumes the next track's earliest narration frame,
            // acknowledges it, and hands off when the backend publishes track.
            return;
        }

        await nextTrack(true);
    }

    async function continueGuidedPlayback() {
        logAudioDebug('Spotify return action', {action: 'Let Spotify choose the next track'});
        spotify.close();

        guidedReady = false;
        spotify.reset();

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
        logAudioDebug('Spotify return action', {action: 'Skip'});
        spotify.close();

        guidedReady = false;
        spotify.reset();

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

    async function finishGuidedCycleWithoutStartingAudio(): Promise<void> {
        spotify.close();

        guidedReady = false;
        spotify.reset();
        isPlaying.set(false);
        playbackPhase.set('idle');

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

        navigation.completeCurrentTrack();
    }

    async function chooseNextGuidedTrack(): Promise<void> {
        logAudioDebug('Spotify return action', {action: 'Choose the next track yourself'});
        if (guidedReturnActionInProgress) return;
        guidedReturnActionInProgress = true;

        try {
            await finishGuidedCycleWithoutStartingAudio();
            openGuidedTrackList = true;
        } finally {
            guidedReturnActionInProgress = false;
        }
    }

    async function returnToCarModeAfterGuidedPlayback(): Promise<void> {
        logAudioDebug('Spotify return action', {action: 'Return to Car Mode'});
        if (guidedReturnActionInProgress) return;
        guidedReturnActionInProgress = true;

        try {
            await finishGuidedCycleWithoutStartingAudio();
        } finally {
            guidedReturnActionInProgress = false;
        }
    }

    function returnToGuidedCarPage(): void {
        spotify.close();

        guidedReady = false;
        spotify.reset();
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
                voice_style: settings.voicePlayMode,
                detail_length: sel.context?.artistDetailLength ?? 'short',
                bio_length: sel.context?.artistBioLength ?? 'short'
            });

            for (const selectedGenre of (sel.context?.artistRadioGenres ?? '').split(',').filter(Boolean)) {
                artistParams.append('genres', selectedGenre);
            }

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
                selection: buildPlaybackSelection(sel, settings),
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
                                        collection_group_slug: sel.context?.collection_group_slug,
                                        ...(sel.context?.radioCollectionGroups
                                            ? {collection_group_slugs: sel.context.radioCollectionGroups.split(',')}
                                            : {})
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
            appendNostalgiaRadioGenres(
                radioParams,
                selectedNostalgiaRadioGenres(sel.context?.radioGenres, sel.context?.genre)
            );

            const response = await startRadioSequence(radioParams);

            if (!response.ok) {
                throw new Error(`Interactive Radio start failed (${response.status})`);
            }

            const startResult = await response.json() as {status?: string; mode?: string};
            console.info('[car-page] Interactive Radio start acknowledged', startResult);

            if (startResult.status !== 'started') {
                throw new Error('Interactive Radio did not acknowledge startup.');
            }

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

        const res = await fetch(`${API_BASE}/playback/play-track`, playbackTrackRequestInit(payload));

        if (res.ok && sel.mode === 'artist_spotlight') {
            artistBioPlayedThisSet = true;
        }
    }

    async function handleGuidedPlay() {
        activePlayMode = 'guided';
        if (!$currentTrack) return;
        captureProgramStartedOnce();
        logAudioDebug('Guided action', {
            trackRank: $currentTrack?.rank ?? null,
            trackName: $currentTrack?.trackName ?? null,
            playbackPhase: get(playbackPhase)
        });
        await handlePlayPause();
    }

    const autoPlay = createCarModeAutoPlay(
        {
            getActivePlayMode: () => activePlayMode,
            setActivePlayMode: mode => (activePlayMode = mode),
            getCurrentTrack: () => $currentTrack,
            getIsPlaying: () => get(isPlaying),
            setIsPlaying: playing => isPlaying.set(playing),
            getPlaybackPhase: () => get(playbackPhase),
            setPlaybackPhase: phase => playbackPhase.set(phase),
            pauseNarration: narration.pause,
            takePausedNarrationPhase: narration.takePausedPhase,
            abandonNarration: narration.abandon,
            startNarration: startGuidedTrack,
            prepareSpotifyWindow: spotify.prepareAutoWindow,
            isMobile: spotify.isMobile,
            openSpotify: openGuidedSpotify,
            closeSpotify: spotify.close,
            queueNextTrack: queueNextAutoTrack,
            setStatus: message => status.set(message),
            continueAutoPlayback,
            onSpotifyHandoff: () => {
                if (isBackendRadioAutoHandoffSelection()) {
                    setExternalRadioSpotifyHandoffReady(true);
                }
            },
            onSpotifyOpenFailed: track => {
                if (isBackendRadioAutoHandoffSelection()) {
                    radioSpotifyRetryTrack = track;
                    setExternalRadioSpotifyHandoffReady(false);
                    status.set('Spotify did not open. Press Auto Play to try again.');
                }
            },
            nextTrack,
            previousTrack: prevTrack,
            startPreviousAutoPlayback: () => prevTrack(true)
        },
        AUTO_PLAY_BUFFER_SECONDS
    );

    async function handleAutoPlay() {
        if (needsInitialCollectionsRadioStart()) {
            // This must remain in the click stack. The backend-owned
            // collection_intro/intro/detail pipeline reaches Spotify later,
            // when browsers no longer permit a new popup.
            if (!reserveBackendRadioSpotifyWindow()) return;
            await startInitialCollectionsRadioSet();
            return;
        }

        if (isArtistRadioSelection()) {
            if (radioStartPending) return;
            if (!hasInstalledPrivateRadioTrack()) {
                if (!reserveBackendRadioSpotifyWindow()) return;
                activePlayMode = 'auto';
                setExternalRadioSpotifyHandoffReady(false);
                // Start the poller before launch so the first blocking artist
                // biography is received and acknowledged, just like the
                // working Nostalgia/Collections backend-radio paths.
                startPlaybackPolling({
                    guidedLinkOut: true,
                    externalRadioTrackClock: true,
                    onBackendRadioTrackInstalled: completeBackendRadioAdvance
                });
                markUserStartedPlayback();
                await startInitialArtistRadioSet();
                return;
            }
        }

        if (!$currentTrack) return;
        captureProgramStartedOnce();

        if (isCollectionsRadioAutoHandoffSelection() && radioSpotifyRetryTrack) {
            retryBackendRadioSpotifyHandoff();
            return;
        }

        if (isInterruptibleBackendRadioSelection()) {
            if (radioStartPending) return;

            // This retry is for the backend-selected track whose reserved
            // window was manually closed or blocked. It never re-signals the
            // prior interrupted track-finished event.
            if (radioSpotifyRetryTrack) {
                if (radioInterruptedResumePending) return;
                radioInterruptedResumePending = true;

                // Must run synchronously in this click handler so Chrome
                // treats the wait popup as user initiated.
                const reserved = spotify.prepareAutoWindow();
                if (!reserved) {
                    status.set('Spotify popup was blocked. Press Auto Play to try again.');
                    radioInterruptedResumePending = false;
                    return;
                }

                activePlayMode = 'auto';
                const retryTrack = radioSpotifyRetryTrack;
                radioSpotifyRetryTrack = null;
                autoPlay.handoffCurrentTrack(retryTrack);
                radioInterruptedResumePending = false;
                return;
            }

            // Pause leaves an explicit interrupted track, not a naturally
            // completed one.  Auto Play skips that exact backend-owned track
            // once, then the poller consumes the next authoritative frame.
            if (interruptedRadioTrack) {
                if (radioInterruptedResumePending) return;

                radioInterruptedResumePending = true;

                // Reserve the same wait popup used by initial Auto Play
                // before asynchronous track-finished/poll/narration work.
                // It remains available until the authoritative next track
                // can navigate it to Spotify.
                const reserved = spotify.prepareAutoWindow();
                if (!reserved) {
                    status.set('Spotify popup was blocked. Press Auto Play to try again.');
                    radioInterruptedResumePending = false;
                    return;
                }

                activePlayMode = 'auto';
                setExternalRadioTrackPaused(false);
                setExternalRadioSpotifyHandoffReady(false);

                if (isArtistRadioSelection()) {
                    const resumed = autoPlay.handoffCurrentTrack(interruptedRadioTrack);
                    if (resumed) {
                        autoPlay.clearInterruptedSpotifyTrack();
                        interruptedRadioTrack = null;
                    } else {
                        activePlayMode = null;
                        setExternalRadioTrackPaused(true);
                        isPlaying.set(false);
                        playbackPhase.set('paused');
                    }
                    radioInterruptedResumePending = false;
                    return;
                }

                try {
                    const advanced = await advancePrivateRadioTrack(interruptedRadioTrack);
                    if (advanced) {
                        autoPlay.clearInterruptedSpotifyTrack();
                        interruptedRadioTrack = null;
                    } else {
                        activePlayMode = null;
                        setExternalRadioTrackPaused(true);
                        isPlaying.set(false);
                        playbackPhase.set('paused');
                    }
                } finally {
                    radioInterruptedResumePending = false;
                }
                return;
            }

            if (activePlayMode === 'auto' && get(isPlaying)) {
                const interrupted = autoPlay.interruptSpotifyTrack();
                if (!interrupted) return;

                interruptedRadioTrack = interrupted;
                setExternalRadioTrackPaused(true);
                setExternalRadioSpotifyHandoffReady(false);
                activePlayMode = null;
                isPlaying.set(false);
                playbackPhase.set('paused');
                status.set('Auto Play paused. Press Auto Play to resume.');
                return;
            }

            if (!hasInstalledPrivateRadioTrack()) {
                activePlayMode = 'auto';
                setExternalRadioSpotifyHandoffReady(false);
                if (!spotify.isMobile()) {
                    if (!spotify.prepareAutoWindow()) {
                        activePlayMode = null;
                        status.set('Spotify popup was blocked. Press Auto Play to try again.');
                        return;
                    }
                }
                // Radio narration is backend-owned. Start polling before the
                // sequence so every blocking narration phase is acknowledged.
                startPlaybackPolling({
                    guidedLinkOut: true,
                    externalRadioTrackClock: true,
                    onBackendRadioTrackInstalled: completeBackendRadioAdvance
                });
                markUserStartedPlayback();
                const loaded = await loadFirstRadioSet();
                if (!loaded) return;
            }

            // The status poller plays backend Intro/Detail and opens Spotify
            // only after the backend advances to its track frame.
            return;
        }

        await autoPlay.handlePlay();
    }

    function failFirstSetLoad(message: string): void {
        radioStartPending = false;
        status.set(message);
    }

    function isPrivateNostalgiaRadioSelection(): boolean {
        return interactiveRadioTest &&
            get(currentSelection)?.programType === PROGRAM_TYPES.RADIO_DG;
    }

    function isArtistRadioSelection(): boolean {
        return interactiveRadioTest &&
            get(currentSelection)?.programType === PROGRAM_TYPES.RADIO_ARTIST;
    }

    function isInterruptibleBackendRadioSelection(): boolean {
        return isPrivateNostalgiaRadioSelection() || isArtistRadioSelection();
    }

    function isBackendRadioAutoHandoffSelection(): boolean {
        if (!interactiveRadioTest) return false;
        const programType = get(currentSelection)?.programType;
        return programType === PROGRAM_TYPES.RADIO_DG ||
            programType === PROGRAM_TYPES.RADIO_COL ||
            programType === PROGRAM_TYPES.RADIO_ARTIST;
    }

    function isCollectionsRadioAutoHandoffSelection(): boolean {
        return interactiveRadioTest &&
            get(currentSelection)?.programType === PROGRAM_TYPES.RADIO_COL;
    }

    function reserveBackendRadioSpotifyWindow(): boolean {
        if (spotify.isMobile()) return true;

        const reserved = spotify.prepareAutoWindow();
        console.info('[car-mode] backend radio helper window', {
            programType: get(currentSelection)?.programType ?? null,
            helperWindowPresent: reserved,
            phase: get(playbackPhase),
            spotifyId: get(currentTrack)?.spotifyTrackId ?? null,
            navigationAttempted: false,
            timerStarted: false,
            rejectionReason: reserved ? null : 'popup-blocked'
        });
        if (!reserved) {
            status.set('Spotify popup was blocked. Press Auto Play to try again.');
        }
        return reserved;
    }

    function retryBackendRadioSpotifyHandoff(): void {
        if (radioInterruptedResumePending) return;
        radioInterruptedResumePending = true;

        // Must run synchronously in this click handler so Chrome treats the
        // replacement wait popup as user initiated after a close/block.
        if (!reserveBackendRadioSpotifyWindow()) {
            radioInterruptedResumePending = false;
            return;
        }

        activePlayMode = 'auto';
        const retryTrack = radioSpotifyRetryTrack;
        radioSpotifyRetryTrack = null;
        const handedOff = retryTrack
            ? autoPlay.handoffCurrentTrack(retryTrack)
            : false;
        console.info('[car-mode] backend radio retry handoff', {
            programType: get(currentSelection)?.programType ?? null,
            helperWindowPresent: true,
            phase: get(playbackPhase),
            spotifyId: retryTrack?.spotifyTrackId ?? null,
            navigationAttempted: true,
            navigationSucceeded: handedOff,
            timerStarted: handedOff,
            rejectionReason: handedOff ? null : 'spotify-handoff-failed'
        });
        radioInterruptedResumePending = false;
    }

    function needsInitialCollectionsRadioStart(): boolean {
        const selection = get(currentSelection);
        const track = get(currentTrack);
        return selection?.programType === PROGRAM_TYPES.RADIO_COL &&
            (!track || track.rank <= 0 || !track.spotifyTrackId);
    }

    function collectionsRadioStartupTrack(): CarModeTrack {
        return get(currentTrack) ?? {
            id: null,
            rankingId: null,
            rank: 0,
            trackName: 'TopSpot Collections Radio',
            artistName: 'Press Play to Start',
            spotifyTrackId: '',
            albumArtwork: null,
            durationSeconds: 0
        };
    }

    async function startInitialCollectionsRadioSet(): Promise<void> {
        if (playbackStartInFlight) return;

        playbackStartInFlight = true;
        activePlayMode = 'auto';
        isPlaying.set(false);
        playbackPhase.set('idle');

        try {
            // Like the initial Nostalgia Radio branch, backend radio owns the
            // first real track. Poll before the request so its first context
            // can replace the rank-0 placeholder as soon as it is available.
            startPlaybackPolling({
                guidedLinkOut: true,
                externalRadioTrackClock: true,
                acceptRadioContext: selectedCollectionGroupAllowed,
                onBackendRadioTrackInstalled: completeBackendRadioAdvance
            });
            markUserStartedPlayback();
            await playTrack(collectionsRadioStartupTrack());
            userStartedPlaybackThisSession = true;
        } finally {
            playbackStartInFlight = false;
        }
    }

    function selectedCollectionGroupAllowed(context: Record<string, unknown>): boolean {
        const selection = get(currentSelection);
        if (selection?.programType !== PROGRAM_TYPES.RADIO_COL) return true;
        const generated = typeof context.collection_group_slug === 'string'
            ? context.collection_group_slug.trim().toLowerCase()
            : '';
        if (!generated) return false;
        const explicit = (selection.context?.radioCollectionGroups ?? '')
            .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
        if (explicit.length > 0) return explicit.includes(generated);
        const legacy = selection.context?.collection_group_slug;
        return !legacy || legacy === 'ALL' || legacy.toLowerCase() === generated;
    }

    function hasInstalledPrivateRadioTrack(): boolean {
        const track = get(currentTrack);
        return Boolean(track?.spotifyTrackId && typeof track.setNumber === 'number');
    }

    function completeBackendRadioAdvance(installedSpotifyTrackId: string | null): void {
        if (
            !radioCompletionSpotifyTrackId ||
            installedSpotifyTrackId === radioCompletionSpotifyTrackId
        ) {
            return;
        }

        radioCompletionSpotifyTrackId = null;
        radioAdvancePending = false;
    }

    interface RadioTrackStatusData {
        context?: Record<string, unknown>;
        track_name?: string;
        artist_name?: string;
        current_rank?: number | string;
    }

    function installRadioTrackStatus(
        data: RadioTrackStatusData,
        previousSpotifyTrackId?: string | null
    ): boolean {
        const context = data.context;
        const spotifyTrackId = context?.spotify_track_id;
        const setNumber = context?.set_number;
        const blockPosition = context?.block_position;
        const blockSize = context?.block_size;
        const radioSelection = get(currentSelection);
        // Retain the legacy single-genre guard for URLs without `genres`.
        const requestedGenre = radioSelection?.context?.genre;
        const generatedGenre = context?.genre_slug ?? context?.genre;

        if (
            typeof spotifyTrackId !== 'string' ||
            typeof setNumber !== 'number' ||
            typeof blockPosition !== 'number' ||
            typeof blockSize !== 'number' ||
            !data.track_name ||
            !data.artist_name ||
            (requestedGenre && requestedGenre !== 'ALL' && generatedGenre !== requestedGenre) ||
            !isGeneratedNostalgiaRadioGenreAllowed(
                radioSelection?.context?.radioGenres,
                radioSelection?.context?.genre,
                typeof generatedGenre === 'string' ? generatedGenre : undefined
            ) ||
            (previousSpotifyTrackId && spotifyTrackId === previousSpotifyTrackId)
        ) {
            return false;
        }

        const track = buildFallbackPlaybackTrack({
            spotifyId: spotifyTrackId,
            currentRank: Number(data.current_rank ?? 0),
            trackName: String(data.track_name),
            artistName: String(data.artist_name),
            normalizedCtx: normalizePlaybackContext(context)
        }) as CarModeTrack;

        tracks.set([track]);
        currentTrack.set(track);
        completeBackendRadioAdvance(track.spotifyTrackId ?? null);
        interruptedRadioTrack = null;
        radioInterruptedResumePending = false;
        radioSpotifyRetryTrack = null;
        setExternalRadioTrackPaused(false);
        setExternalRadioSpotifyHandoffReady(false);
        currentRank.set(track.rank);
        isPlaying.set(false);
        playbackPhase.set('idle');
        elapsed.set(0);
        duration.set(0);
        progress.set(0);
        status.set(`Set ${setNumber}: ${track.decadeName ?? ''} ${track.genreName ?? ''}`.trim());
        return true;
    }

    async function waitForRadioTrack(previousSpotifyTrackId?: string | null): Promise<boolean> {
        for (let attempt = 0; attempt < 40; attempt += 1) {
            try {
                const response = await fetchPlaybackStatus();
                if (response.status === 401) {
                    failFirstSetLoad('Your private playback session could not be authorized. Please try again.');
                    return false;
                }
                if (!response.ok) {
                    failFirstSetLoad('Unable to read the radio set from the playback service.');
                    return false;
                }

                const data = await response.json() as Record<string, any>;
                if (installRadioTrackStatus(data, previousSpotifyTrackId)) {
                    radioStartPending = false;
                    return true;
                }
            } catch (error) {
                console.error('[car-page] radio set status failed', error);
                failFirstSetLoad('Unable to load the radio set. Please try again.');
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 350));
        }

        failFirstSetLoad('The radio set took too long to load. Please try again.');
        return false;
    }

    async function startInitialArtistRadioSet(): Promise<boolean> {
        if (!isArtistRadioSelection() || radioStartPending) return false;

        const selection = get(currentSelection);
        if (!selection) return false;
        radioStartPending = true;
        const genres = (selection.context?.artistRadioGenres ?? '')
            .split(',')
            .filter(Boolean);
        const detailLength = selection.context?.artistDetailLength ?? 'short';
        const bioLength = selection.context?.artistBioLength ?? 'short';
        const params = new URLSearchParams({
            genre: 'ALL',
            tts_language: selection.language ?? 'en',
            detail_length: detailLength,
            bio_length: bioLength
        });
        for (const genre of genres) params.append('genres', genre);

        console.info('[car-mode] Artist Radio launch request', {
            genres,
            detailLength,
            bioLength,
            pollingAlreadyStarted: true
        });
        try {
            const guestSession = await startGuestPlaybackSession();
            if (!guestSession.ok) {
                failFirstSetLoad('Unable to establish a private playback session. Please try again.');
                return false;
            }
            const response = await fetch(
                `${API_BASE}/artist-spotlight/play-radio?${params.toString()}`,
                {method: 'POST', credentials: 'include'}
            );
            const result = await response.json() as {ok?: boolean};
            if (!response.ok || !result.ok) {
                failFirstSetLoad('Unable to start Artist Radio. Please try again.');
                return false;
            }
            radioStartPending = false;
            status.set('Artist Radio is choosing the first artist…');
            return true;
        } catch (error) {
            console.error('[car-mode] Artist Radio launch failed', error);
            failFirstSetLoad('Unable to start Artist Radio. Please try again.');
            return false;
        }
    }

    async function loadFirstRadioSet(): Promise<boolean> {
        if (!interactiveRadioTest || radioStartPending) return false;

        const selection = get(currentSelection);
        if (selection?.programType !== PROGRAM_TYPES.RADIO_DG) return false;

        radioStartPending = true;
        status.set('Generating the first radio set…');

        const settings = get(playbackSettingsStore);
        const detailLength = settings.voices.includes('detail')
            ? settings.detailLength
            : 'off';

        const params = new URLSearchParams({
            decade: selection.context?.decade ?? 'ALL',
            genre: selection.context?.genre ?? 'ALL',
            tts_language: selection.language ?? 'en',
            languages: (selection.languages ?? [selection.language]).join(','),
            // The backend owns the narration pipeline. The poller accepts its
            // earliest context and sends each required acknowledgement before
            // the backend can publish Spotify.
            play_intro: 'true',
            // detail_length is the radio contract; retain the boolean for
            // callers which still understand only the legacy flag.
            detail_length: detailLength,
            play_detail: String(detailLength !== 'off'),
            play_artist_description: String(artistStoriesEnabled),
            play_track: 'true'
        });
        appendNostalgiaRadioGenres(
            params,
            selectedNostalgiaRadioGenres(selection.context?.radioGenres, selection.context?.genre)
        );

        try {
            // This establishes a signed, HttpOnly guest playback session when
            // the visitor is not signed in. The guest identity never reaches
            // JavaScript; subsequent credentialed requests carry the cookie.
            const guestSession = await startGuestPlaybackSession();
            if (!guestSession.ok) {
                failFirstSetLoad('Unable to establish a private playback session. Please try again.');
                return false;
            }

            const response = await startRadioSequence(params);
            if (response.status === 401) {
                failFirstSetLoad('Your private playback session could not be authorized. Please try again.');
                return false;
            }
            if (!response.ok) {
                failFirstSetLoad('Unable to start the radio set generator.');
                return false;
            }

            const result = await response.json() as {status?: string};
            if (result.status !== 'started') {
                failFirstSetLoad('The radio set generator did not start.');
                return false;
            }

            radioNarrationPolicyActive = true;

            return waitForRadioTrack();
        } catch (error) {
            console.error('[car-page] first radio set launch failed', error);
            failFirstSetLoad('Unable to start the radio set generator. Please try again.');
            return false;
        }
    }

    function queueRadioNarrationPolicyUpdate(
        detailLength: 'off' | 'short' | 'long',
        nextArtistStoriesEnabled: boolean
    ): void {
        if (!interactiveRadioTest || !radioNarrationPolicyActive) return;

        radioNarrationPolicyUpdate = radioNarrationPolicyUpdate
            .catch(() => undefined)
            .then(async () => {
                const response = await updateRadioNarrationPolicy({
                    detailLength,
                    artistStoriesEnabled: nextArtistStoriesEnabled
                });
                if (!response.ok) {
                    throw new Error(`Radio narration policy update failed: ${response.status}`);
                }
            })
            .catch(error => {
                console.warn('[car-page] Unable to queue narration options for next set', error);
            });
    }

    function handleDetailLengthChange(detailLength: 'off' | 'short' | 'long'): void {
        playbackSettingsStore.update(current => ({...current, detailLength}));
        queueRadioNarrationPolicyUpdate(detailLength, artistStoriesEnabled);
    }

    function handleArtistStoriesChange(enabled: boolean): void {
        artistStoriesEnabled = enabled;
        queueRadioNarrationPolicyUpdate(
            get(playbackSettingsStore).detailLength,
            enabled
        );
    }

    async function advancePrivateRadioTrack(trackOverride?: CarModeTrack): Promise<boolean> {
        const track = trackOverride ?? get(currentTrack);
        if (!track?.spotifyTrackId) {
            failFirstSetLoad('The current radio track is unavailable.');
            return false;
        }
        if (
            radioStartPending ||
            radioAdvancePending ||
            radioCompletionSpotifyTrackId === track.spotifyTrackId
        ) {
            return false;
        }

        // The Auto Play timer is normally single-shot; keep this explicit
        // guard so a duplicate browser callback cannot signal this backend
        // track more than once while its next status frame is pending.
        radioCompletionSpotifyTrackId = track.spotifyTrackId;
        radioAdvancePending = true;

        status.set('Loading the next radio track…');
        const response = await signalTrackFinishedApi({
            rankingId: track.rankingId,
            spotifyTrackId: track.spotifyTrackId
        });
        if (response.status === 401) {
            radioCompletionSpotifyTrackId = null;
            radioAdvancePending = false;
            failFirstSetLoad('Your private playback session could not be authorized. Please try again.');
            return false;
        }
        if (!response.ok) {
            radioCompletionSpotifyTrackId = null;
            radioAdvancePending = false;
            failFirstSetLoad('Unable to advance the radio set. Please try again.');
            return false;
        }

        const result = await response.json().catch(() => null) as {ignored?: boolean} | null;
        if (result?.ignored) {
            radioCompletionSpotifyTrackId = null;
            radioAdvancePending = false;
            return false;
        }

        // Do not wait for the final track frame: Track 2's Intro/Detail frame
        // is authoritative and the backend is waiting for its acknowledgement.
        return true;
    }

    function openPlaybackPreferences(): void {
        preservePlaybackForPreferences = true;
        void goto(buildCarModePreferencesUrl(
            new URL(window.location.href),
            get(currentTrack),
            programStartedTracker.hasStarted()
        ));
    }

    async function invalidateLanguageChangedPlayback(): Promise<void> {
        cancelAllCarModeAutoPlay();
        autoPlay.cancel();
        interruptedRadioTrack = null;
        radioInterruptedResumePending = false;
        radioSpotifyRetryTrack = null;
        setExternalRadioTrackPaused(false);
        setExternalRadioSpotifyHandoffReady(false);
        activePlayMode = null;
        narration.abandon();
        stopNarrationAudio();
        stopBed();
        guidedReady = false;
        spotify.close();
        spotify.reset();
        stopPlaybackPolling();
        resetNarrationPhaseState();
        resetSpotifyStartState();
        showNarrationModal.set(false);
        playbackStartInFlight = false;
        userStartedPlaybackThisSession = false;

        try {
            await stopPlaybackApi();
        } catch {
            // A stopped or expired backend session is already safe to replace.
        }
    }

    async function handleDriveInNext(): Promise<void> {
        if (isBackendRadioAutoHandoffSelection()) {
            if (
                radioStartPending ||
                radioAdvancePending ||
                get(playbackPhase) !== 'track'
            ) {
                return;
            }

            const track = get(currentTrack);
            if (!track?.spotifyTrackId) return;

            autoPlay.cancel();
            const advanced = await advancePrivateRadioTrack(track);
            if (!advanced) {
                // `track-finished` may be acknowledged but intentionally
                // ignored by the backend before its track clock is eligible.
                // Restore the active handoff instead of letting the stale
                // backend track frame become a false paused state.
                autoPlay.handoffCurrentTrack(track);
                return;
            }

            interruptedRadioTrack = null;
            radioSpotifyRetryTrack = null;
            setExternalRadioTrackPaused(false);
            spotify.returnToWaitingPage();
            spotify.reset();
            isPlaying.set(false);
            return;
        }

        autoPlay.handleNext();
    }

    function handleDriveInPrev(): void {
        autoPlay.handlePrevious();
    }

    async function handlePlayPause() {
        if (!$currentTrack) return;

        const activeSettings = get(playbackSettingsStore);

        if (activeSettings.playbackMethod === 'guided') {
            logAudioDebug(get(isPlaying) ? 'Pause action' : 'Guided action', {
                trackRank: $currentTrack?.rank ?? null,
                playbackPhase: get(playbackPhase),
                guidedReady
            });
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
                    spotify.reset();

                    startPlaybackPolling({
                        guidedLinkOut: true,
                        acceptRadioContext: selectedCollectionGroupAllowed
                    });
                    markUserStartedPlayback();

                    await playTrack($currentTrack);
                    userStartedPlaybackThisSession = true;
                } finally {
                    playbackStartInFlight = false;
                }

                return;
            }

            if (get(isPlaying)) {
                narration.pause();
                playbackPhase.set('paused');
                return;
            }

            if (get(playbackPhase) === 'paused') {
                const pausedPhase = narration.takePausedPhase();

                if (pausedPhase === 'detail' || pausedPhase === 'artist') {
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
            await stopPlaybackApi();
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

        await stopPlaybackApi();
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

    const navigation = createCarModeNavigation({
        getCurrentTrack: () => get(currentTrack),
        getTracks: () => get(tracks),
        getSelection: () => get(currentSelection),
        getPlaybackSettings: () => get(playbackSettingsStore),
        setCurrentTrack: track => currentTrack.set(track),
        setCurrentRank: rank => currentRank.set(rank),
        stopNarrationAudio,
        stopCurrentNarrationPhase,
        stopBed,
        stopPlayback,
        markUserStartedPlayback,
        setUserStartedPlayback: started => (userStartedPlaybackThisSession = started),
        playTrack,
        startAutoPlay: handleAutoPlay
    });

    async function handleJumpToTrack(track: CarModeTrack): Promise<void> {
        logAudioDebug('Track List action', {
            trackRank: track.rank,
            trackName: track.trackName,
            artistName: track.artistName,
            playbackPhase: get(playbackPhase)
        });
        if (activePlayMode === 'auto') {
            currentTrack.set(track);
            currentRank.set(track.rank);

            markUserStartedPlayback();
            await autoPlay.playSelectedTrack(track);
            userStartedPlaybackThisSession = true;
            return;
        }

        await navigation.jumpTo(track);
    }

    async function nextTrack(releaseAutoLock = false): Promise<void> {
        logAudioDebug('Next action', {
            trackRank: get(currentTrack)?.rank ?? null,
            playbackPhase: get(playbackPhase),
            releaseAutoLock
        });
        await navigation.next(releaseAutoLock);
    }

    async function queueNextAutoTrack(): Promise<void> {
        if (!navigation.queueNext()) return;

        guidedReady = false;
        spotify.reset();
        resetPlaybackProgress();
    }

    async function prevTrack(startAutoPlay = false): Promise<void> {
        logAudioDebug('Previous action', {
            trackRank: get(currentTrack)?.rank ?? null,
            playbackPhase: get(playbackPhase),
            startAutoPlay
        });
        await navigation.previous(startAutoPlay);
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    const toTitleCase = (text: string | null | undefined): string =>
        text ? text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1)) : '';


    $: console.log('showCamera =', $showCamera);

    $: {
        const sel = $currentSelection;

        if (!sel) {
            lastProgramKey = null;
            navigation.resetPlayedRanks();
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
                artistStoriesEnabled = false;
                artistStoriesPlayed = new Set<string>();
                guidedSpotifyOpenedThisProgram = false;
            }

            const history = $programHistoryStore.find(p => p.key === key);
            navigation.setPlayedRanks(history?.playedRanks ?? []);
        }
    }

    const isRadioMode =
        $currentSelection?.mode === 'decade_genre' &&
        $currentSelection?.context?.decade === 'ALL';

    $: uiDecade =
        $currentSelection?.programType === PROGRAM_TYPES.RADIO_COL
            ? 'Collections Radio'
            : $currentSelection?.mode === 'decade_genre'
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
                    ? nostalgiaRadioStationLabel(
                        $currentSelection.context?.radioGenres,
                        $currentSelection.context?.genre
                    )
                    : ($currentTrack?.genreName ?? toTitleCase($currentSelection.context?.genre ?? ''))
            )
            : '';

    $: bannerTitle =
        headerMode === 'artist_spotlight'
            ? ($currentSelection?.context?.artist_name ?? $currentTrack?.artistName ?? '')
            : uiDecade;

    $: collectionRadioLabel = (() => {
        const selected = ($currentSelection?.context?.radioCollectionGroups ?? '')
            .split(',').filter(Boolean);
        if (selected.length > 1) return 'CUSTOM';
        const legacy = $currentSelection?.context?.collection_group_slug ?? 'ALL';
        return legacy === 'ALL' ? 'ALL' : (collectionGroupNameMap[legacy] ?? toTitleCase(legacy));
    })();

    $: bannerSubtitle =
        headerMode === 'collection'
            ? (
                $currentSelection?.programType === PROGRAM_TYPES.RADIO_COL
                    ? collectionRadioLabel
                    : (collectionGroupNameMap[
                    $currentSelection?.context?.collection_group_slug ?? ''
                        ] ?? '')
            )
            : headerMode === 'artist_spotlight'
                ? 'Artist Spotlight'
                : uiGenre;

    $: driveInProgramTitle =
        interactiveRadioTest
            ? radioMarqueeTitle
            : headerMode === 'collection'
            ? uiDecade
            : headerMode === 'artist_spotlight'
                ? `${bannerTitle} Spotlight`
                : `${uiDecade} ${uiGenre}`.trim();

    // Radio identity is the requested listener scope, while radioSetLabel
    // remains the authoritative decade/genre description for each set.
    $: radioMarqueeTitle =
        $currentSelection?.programType === 'RADIO_ARTIST'
            ? 'ARTIST RADIO'
            : $currentSelection?.programType === PROGRAM_TYPES.RADIO_COL
            ? `${collectionRadioLabel.toUpperCase()} COLLECTIONS RADIO`
            : `${nostalgiaRadioStationLabel(
                $currentSelection?.context?.radioGenres,
                $currentSelection?.context?.genre
            ).toUpperCase()} RADIO`;

    $: radioSetLabel = interactiveRadioTest && $currentSelection?.programType === PROGRAM_TYPES.RADIO_COL
        ? `${$currentTrack?.collection_name ?? ''}${$currentTrack?.collection_group_name ? ` • ${$currentTrack.collection_group_name}` : ''}`.trim()
        : interactiveRadioTest && $currentTrack?.decadeName && $currentTrack?.genreName
            ? `${$currentTrack.decadeName} ${$currentTrack.genreName}`
            : '';


    $: headerMode =
        $currentSelection?.mode === 'decade_genre' ||
        $currentSelection?.mode === 'collection' ||
        $currentSelection?.mode === 'artist_spotlight'
            ? $currentSelection.mode
            : 'decade_genre';


    function radioChangeMusicDestination(): string {
        const radioReturnTo = new URLSearchParams(window.location.search).get('radioReturnTo');
        return isRadioExperienceDestination(radioReturnTo)
            ? radioReturnTo ?? '/interactive-radio-test'
            : '/interactive-radio-test';
    }

    async function abandonInteractiveRadioAndReturn(): Promise<void> {
        if (radioChangeMusicInProgress) return;
        radioChangeMusicInProgress = true;

        // Do this synchronously before backend cleanup so no timer, narration,
        // poll, or Spotify callback can affect the abandoned session.
        cancelAllCarModeAutoPlay();
        autoPlay.cancel();
        interruptedRadioTrack = null;
        radioInterruptedResumePending = false;
        radioSpotifyRetryTrack = null;
        radioCompletionSpotifyTrackId = null;
        radioStartPending = false;
        radioAdvancePending = false;
        radioNarrationPolicyActive = false;
        setExternalRadioTrackPaused(false);
        setExternalRadioSpotifyHandoffReady(false);
        activePlayMode = null;
        stopCurrentNarrationPhase({resolvePhase: false});
        narration.abandon();
        stopNarrationAudio();
        stopBed();
        guidedReady = false;
        spotify.close();
        spotify.reset();
        stopPlaybackPolling();
        resetNarrationPhaseState();
        resetSpotifyStartState();
        resetPlaybackProgress();
        showNarrationModal.set(false);
        playbackStartInFlight = false;
        userStartedPlaybackThisSession = false;

        // Bound the request so an unavailable backend cannot trap the listener
        // on the player. Aborting also prevents a stale stop from reaching a
        // newly started station after navigation.
        const abortController = new AbortController();
        const stopTimeout = window.setTimeout(() => abortController.abort(), 1500);
        try {
            await stopPlaybackApi(abortController.signal);
        } catch {
            // Local cleanup is complete; a stopped or expired runtime is safe.
        } finally {
            window.clearTimeout(stopTimeout);
        }

        window.location.href = radioChangeMusicDestination();
    }

    function backToOptions() {
        if (interactiveRadioTest) {
            void abandonInteractiveRadioAndReturn();
            return;
        }
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

        if (
            interactiveRadioTest &&
            (
                get(currentSelection)?.programType === PROGRAM_TYPES.RADIO_DG ||
                get(currentSelection)?.programType === PROGRAM_TYPES.RADIO_COL
            )
        ) {
            // The backend radio loop receives the track-finished signal from
            // the poller and selects the next track/set itself.
            return;
        }

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

        if (isBackendRadioAutoHandoffSelection()) {
            // Backend narration is complete only when it publishes `track`.
            // Reuse Auto Play solely for the Spotify handoff and its timer.
            if (activePlayMode === 'auto') {
                autoPlay.handoffCurrentTrack(track);
            }
            return;
        }

        spotify.reset();
        guidedReady = true;

        isPlaying.set(false);
        playbackPhase.set('track');
    }

    function handleAudioDebugVisibilityChange(): void {
        logAudioDebug('visibilitychange', {
            visibilityState: document.visibilityState,
            playbackPhase: get(playbackPhase),
            guidedReady
        });
        spotify.handleReturn();
    }

    function handleAudioDebugFocus(): void {
        logAudioDebug('focus', {playbackPhase: get(playbackPhase), guidedReady});
        spotify.handleReturn();
    }

    function handleAudioDebugBlur(): void {
        logAudioDebug('blur', {playbackPhase: get(playbackPhase), guidedReady});
    }

    function handleAudioDebugPageHide(): void {
        logAudioDebug('pagehide', {playbackPhase: get(playbackPhase), guidedReady});
    }

    function handleAudioDebugPageShow(): void {
        logAudioDebug('pageshow', {playbackPhase: get(playbackPhase), guidedReady});
        spotify.handleReturn();
    }


    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    onMount(async () => {
        console.info('[car-page] build marker main@3ce2b0b mini-player-tap-diagnostic');

        carScreen = window.matchMedia('(max-width: 1199px)');
        updateCarLayout();
        carScreen.addEventListener('change', updateCarLayout);

        const url = new URL(window.location.href);
        interactiveRadioTest = url.searchParams.get('interactiveRadioTest') === 'true';
        if (interactiveRadioTest && isSmallScreen) {
            interactiveRadioBlocked = true;
            status.set('Interactive Radio testing requires a desktop computer.');
            return;
        }

        const savedCarDisplay = localStorage.getItem('topspot_car_display');

        if (interactiveRadioTest) {
            carDisplayView = 'drive-in';
            playbackSettingsStore.update(current => ({
                ...current,
                playbackMethod: 'automatic',
                playbackOrder: 'shuffle',
                pauseMode: 'continuous',
                skipPlayed: true
            }));
        } else if (isSmallScreen) {
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
            handleAudioDebugVisibilityChange
        );
        window.addEventListener(
            'focus',
            handleAudioDebugFocus
        );
        window.addEventListener('blur', handleAudioDebugBlur);
        window.addEventListener('pagehide', handleAudioDebugPageHide);
        window.addEventListener('pageshow', handleAudioDebugPageShow);
        window.addEventListener('ts-next-track', handleAutoNextTrack);
        window.addEventListener('ts-guided-track-ready', handleGuidedTrackReady);

        const languageChangedReturn = isChangedCarModePreferencesReturn(url);
        const languageUnchangedReturn = isUnchangedCarModePreferencesReturn(url);

        if (
            (languageChangedReturn || languageUnchangedReturn) &&
            url.searchParams.get('carModeProgramStarted') === 'true'
        ) {
            programStartedTracker.markStarted();
        }

        if (languageUnchangedReturn) {
            // The previous Car Mode instance deliberately kept its session alive.
            // Do not reload tracks or touch browser/backend playback for this return.
            return;
        }

        if (languageChangedReturn) {
            await invalidateLanguageChangedPlayback();
        }

        const hasParams = url.searchParams.toString().length > 0;

        setPlaybackView(
            !interactiveRadioTest && url.searchParams.get('view') === 'studio'
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

        // Collections Radio's protected playback endpoints require the guest
        // cookie even for the initial reset. This mirrors the private
        // Nostalgia Radio startup: establish the guest session before making
        // any backend playback request, regardless of playback method.
        if (sel.programType === PROGRAM_TYPES.RADIO_COL) {
            try {
                const guestSession = await startGuestPlaybackSession();
                if (!guestSession.ok) {
                    status.set('Unable to establish a private playback session. Please try again.');
                    return;
                }
            } catch (err) {
                console.warn('Unable to establish Collections Radio guest session:', err);
                status.set('Unable to establish a private playback session. Please try again.');
                return;
            }
        }

        const mountedSettings = get(playbackSettingsStore);

        if (mountedSettings.playbackMethod === 'automatic' && !interactiveRadioTest) {
            // Automatic Playback keeps the existing backend transport.
            try {
                await resetPlaybackApi();
            } catch (err) {
                console.warn('⚠️ Backend reset failed (continuing anyway):', err);
            }

            startPlaybackPolling(
                interactiveRadioTest ? {guidedLinkOut: true} : undefined
            );
        } else {
            // Guided Playback owns narration and Spotify handoff in the browser.
            resetNarrationPhaseState();
            playbackPhase.set('idle');
            isPlaying.set(false);
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
        if (languageChangedReturn) {
            const returnedTrack = findReturnedCarModeTrack(get(tracks), url);
            if (returnedTrack) {
                currentTrack.set(returnedTrack);
                currentRank.set(returnedTrack.rank);
            }
        }
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
            handleAudioDebugVisibilityChange
        );

        window.removeEventListener(
            'focus',
            handleAudioDebugFocus
        );
        window.removeEventListener('blur', handleAudioDebugBlur);
        window.removeEventListener('pagehide', handleAudioDebugPageHide);
        window.removeEventListener('pageshow', handleAudioDebugPageShow);

        window.removeEventListener(
            'ts-next-track',
            handleAutoNextTrack
        );
        window.removeEventListener(
            'ts-guided-track-ready',
            handleGuidedTrackReady
        );

        if (!preservePlaybackForPreferences) {
            autoPlay.cancel();
            stopPlaybackPolling();
            void clearAllPlayback();
        }
    });

</script>

{#if interactiveRadioBlocked}
    <main class="interactive-radio-desktop-required">
        <p>Interactive Radio testing requires a desktop computer.</p>
    </main>
{:else}
<PublicJourneyHeader
        language={$currentSelection?.language ?? 'en'}
        onPreferences={openPlaybackPreferences}
/>


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
                    collection={headerMode === 'collection'
                        ? ($currentSelection?.programType === PROGRAM_TYPES.RADIO_COL && collectionRadioLabel === 'CUSTOM'
                            ? `${uiDecade} • ${collectionRadioLabel}`
                            : uiDecade)
                        : undefined}
                    mode={headerMode}
                    programType={$currentSelection.programType}
                    language={$currentSelection.language}
                        compact={carDisplayView === 'drive-in'}
                        detailLength={$currentSelection.programType === 'RADIO_ARTIST'
                            ? (($currentSelection.context?.artistDetailLength as 'off' | 'short' | 'long' | undefined) ?? 'short')
                            : settings.detailLength}
                        artistBioLength={$currentSelection.programType === 'RADIO_ARTIST'
                            ? (($currentSelection.context?.artistBioLength as 'short' | 'long' | undefined) ?? 'short')
                            : 'short'}
                        {artistStoriesEnabled}
                        onDetailLengthChange={(value) => { handleDetailLengthChange(value); if ($currentSelection.programType === 'RADIO_ARTIST') currentSelection.update(selection => selection ? {...selection, context: {...selection.context, artistDetailLength: value}} : selection); }}
                        onArtistStoriesChange={handleArtistStoriesChange}
                        onArtistBioLengthChange={(value) => currentSelection.update(selection => selection ? {...selection, context: {...selection.context, artistBioLength: value}} : selection)}
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
                        language={$currentSelection.language}
                        showNarrationModal={$showNarrationModal}
                        {narrationModalInitialMode}
                        setShowNarrationModal={setNarrationModalOpen}
                        onPrev={handleDriveInPrev}
                        onNext={handleDriveInNext}
                        onJumpToTrack={handleJumpToTrack}
                        onPlayPause={handleGuidedPlay}
                        activePlayMode={activePlayMode}
                        onAutoPlay={handleAutoPlay}
                        onBackToOptions={backToOptions}
                        onUseClassicView={() => setCarDisplayView('classic')}
                        radioAutoOnly={interactiveRadioTest}
                        radioSetNumber={interactiveRadioTest ? $currentTrack.setNumber ?? null : null}
                        radioSetPosition={interactiveRadioTest ? $currentTrack.blockPosition ?? null : null}
                        radioSetSize={interactiveRadioTest ? $currentTrack.blockSize ?? null : null}
                        {radioSetLabel}
                        radioLoadPending={radioStartPending || radioAdvancePending}
                        onReportProblem={() => openReportProblem()}
                        onReportNarration={openNarrationReport}
                        openTrackList={openGuidedTrackList}
                        onTrackListClosed={() => (openGuidedTrackList = false)}
                />
            {:else}
                {#if !isSmallScreen}
                    <div class="classic-view-toolbar">
                        <button
                                type="button"
                                on:click={() => setCarDisplayView('drive-in')}
                        >
                            🎞 {classicViewCopy[$currentSelection?.language ?? 'en'].driveInView}
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
                        onReportProblem={() => openReportProblem()}
                        onReportNarration={openNarrationReport}
                        openTrackList={openGuidedTrackList}
                        onTrackListClosed={() => (openGuidedTrackList = false)}
                />
            {/if}

            {#if settings.playbackMethod === 'guided' && guidedReady && activePlayMode !== 'auto'}
                <GuidedPlaybackPanel
                        track={$currentTrack}
                        opened={$spotifyState.opened}
                        returned={$spotifyState.returned}
                        onOpenSpotify={openGuidedSpotify}
                        spotifyOpenedThisProgram={guidedSpotifyOpenedThisProgram}
                        onContinue={continueGuidedPlayback}
                        onSkip={skipGuidedTrack}
                        onBackToCar={returnToGuidedCarPage}
                        onChooseNextTrack={chooseNextGuidedTrack}
                        onReturnToCarMode={returnToCarModeAfterGuidedPlayback}
                        language={$currentSelection?.language ?? 'en'}
                        onReportProblem={() => openReportProblem()}
                />
            {/if}


        {:else}
            <p class="text-gray-400 italic text-center mt-10">{$status}</p>
        {/if}

        <ReportProblemModal
            open={reportContext !== null}
            context={reportContext}
            language={reportContext?.selected_language ?? $currentSelection?.language ?? 'en'}
            initialIssueType={reportInitialIssueType}
            onClose={() => {
                reportContext = null;
                reportInitialIssueType = undefined;
            }}
        />

        {#if $pauseMessage}
            <div class="pause-banner">
                {$pauseMessage}
            </div>
        {/if}

    {/if}


</div>
{/if}

{#if $audioDebugEnabled}
    <AudioDiagnosticPanel />
{/if}

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




