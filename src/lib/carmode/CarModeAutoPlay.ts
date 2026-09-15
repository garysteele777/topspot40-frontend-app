import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import type {PlaybackPhase} from '$lib/helpers/car/types';

type AutoPlayMode = 'guided' | 'auto' | null;

const activeCancels = new Set<() => void>();

export function cancelAllCarModeAutoPlay(): void {
    for (const cancel of activeCancels) {
        cancel();
    }
}

export type CarModeAutoPlayDependencies = {
    getActivePlayMode: () => AutoPlayMode;
    setActivePlayMode: (mode: AutoPlayMode) => void;
    getCurrentTrack: () => CarModeTrack | null;
    getIsPlaying: () => boolean;
    setIsPlaying: (playing: boolean) => void;
    getPlaybackPhase: () => PlaybackPhase;
    setPlaybackPhase: (phase: PlaybackPhase) => void;
    pauseNarration: () => void;
    takePausedNarrationPhase: () => 'intro' | 'detail' | null;
    abandonNarration: () => void;
    startNarration: (
        track: CarModeTrack,
        startPhase?: 'intro' | 'detail'
    ) => Promise<boolean>;
    prepareSpotifyWindow: () => void;
    isMobile: () => boolean;
    openSpotify: () => boolean;
    closeSpotify: () => boolean;
    queueNextTrack: () => Promise<void>;
    setStatus: (message: string) => void;
    continueAutoPlayback: () => Promise<void>;
    onSpotifyHandoff?: (track: CarModeTrack) => void;
    onSpotifyOpenFailed?: (track: CarModeTrack) => void;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
    startPreviousAutoPlayback: () => Promise<void>;
};

export function createCarModeAutoPlay(
    dependencies: CarModeAutoPlayDependencies,
    bufferSeconds: number
) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let runId = 0;
    let handoffToken: string | null = null;
    // This is deliberately different from a completed cycle.  A Spotify
    // window cannot be reliably paused/resumed, so an interrupted track must
    // be handed back to the backend only when the listener explicitly starts
    // Auto Play again.
    let interruptedTrack: CarModeTrack | null = null;

    const trackToken = (track: CarModeTrack): string =>
        `${track.rankingId ?? track.rank}|${track.spotifyTrackId ?? ''}`;

    function cancelCycle(): number {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        return ++runId;
    }

    function startTimer(track: CarModeTrack): void {
        const activeRunId = cancelCycle();
        const durationSeconds =
            track.durationSeconds ??
            (track.durationMs ? Math.floor(track.durationMs / 1000) : 0);

        if (durationSeconds <= 0) {
            console.warn('Auto Play: no track duration available');
            return;
        }

        const delayMs = (durationSeconds + bufferSeconds) * 1000;

        console.log(
            `Auto Play: ${track.trackName} — advancing in ${
                durationSeconds + bufferSeconds
            }s`
        );

        timer = setTimeout(() => {
            if (activeRunId !== runId) return;

            timer = null;
            void advance(activeRunId);
        }, delayMs);
    }

    function handoff(track: CarModeTrack, scheduleAdvance = true): boolean {
        const token = trackToken(track);

        if (
            dependencies.getActivePlayMode() !== 'auto' ||
            handoffToken === token
        ) {
            return false;
        }

        if (!dependencies.openSpotify()) {
            // Do not arm a duration/completion cycle for a track whose
            // Spotify handoff was blocked or whose reserved window closed.
            dependencies.setIsPlaying(false);
            dependencies.setPlaybackPhase('paused');
            dependencies.setActivePlayMode(null);
            dependencies.onSpotifyOpenFailed?.(track);
            return false;
        }

        handoffToken = token;
        dependencies.onSpotifyHandoff?.(track);
        dependencies.setPlaybackPhase('track');
        dependencies.setIsPlaying(true);
        if (scheduleAdvance) startTimer(track);
        return true;
    }

    async function advance(activeRunId: number): Promise<void> {
        if (
            activeRunId !== runId ||
            dependencies.getActivePlayMode() !== 'auto'
        ) {
            return;
        }

        dependencies.setIsPlaying(false);
        await dependencies.continueAutoPlayback();

        if (
            activeRunId !== runId ||
            dependencies.getActivePlayMode() !== 'auto' ||
            dependencies.getIsPlaying() ||
            dependencies.getPlaybackPhase() !== 'track'
        ) {
            return;
        }

        const track = dependencies.getCurrentTrack();

        if (!track) {
            dependencies.setActivePlayMode(null);
            return;
        }

        console.log('AUTO: opening Spotify for', track.trackName, track.spotifyTrackId);
        handoff(track);
    }

    function abandonCycle(): number {
        dependencies.abandonNarration();
        handoffToken = null;

        return cancelCycle();
    }

    function cancel(): void {
        abandonCycle();
        interruptedTrack = null;
    }

    function interruptSpotifyTrack(): CarModeTrack | null {
        const track = dependencies.getCurrentTrack();

        if (
            !track ||
            dependencies.getActivePlayMode() !== 'auto' ||
            dependencies.getPlaybackPhase() !== 'track' ||
            handoffToken !== trackToken(track)
        ) {
            return null;
        }

        // Invalidate the completion callback without abandoning narration or
        // resetting the UI clock: the Drive-In display must stay frozen at
        // the listener's paused position.
        cancelCycle();
        handoffToken = null;
        interruptedTrack = track;

        if (!dependencies.closeSpotify()) {
            dependencies.setStatus('Please close Spotify manually.');
        }

        dependencies.setIsPlaying(false);
        dependencies.setPlaybackPhase('paused');
        return track;
    }

    function getInterruptedSpotifyTrack(): CarModeTrack | null {
        return interruptedTrack;
    }

    function clearInterruptedSpotifyTrack(): void {
        interruptedTrack = null;
    }

    async function pauseSpotifyAndQueueNext(): Promise<void> {
        abandonCycle();

        if (!dependencies.closeSpotify()) {
            dependencies.setStatus('Please close Spotify manually.');
        }

        await dependencies.queueNextTrack();
        dependencies.setIsPlaying(false);
        dependencies.setPlaybackPhase('paused');
    }

    activeCancels.add(cancel);

    async function handlePlay(): Promise<void> {
        const track = dependencies.getCurrentTrack();
        if (!track) return;

        if (
            dependencies.getActivePlayMode() === 'auto' &&
            dependencies.getPlaybackPhase() === 'track' &&
            handoffToken === trackToken(track)
        ) {
            await pauseSpotifyAndQueueNext();
            return;
        }

        if (
            dependencies.getActivePlayMode() === 'auto' &&
            dependencies.getIsPlaying()
        ) {
            dependencies.pauseNarration();
            dependencies.setPlaybackPhase('paused');
            return;
        }

        dependencies.setActivePlayMode('auto');

        if (dependencies.getPlaybackPhase() === 'paused') {
            const paused = dependencies.takePausedNarrationPhase();

            if (paused === 'detail') {
                handoff(track);
                return;
            }

            if (paused === 'intro') {
                const completed = await dependencies.startNarration(track, 'detail');

                if (completed) handoff(track);
                return;
            }
        }

        if (handoffToken === trackToken(track)) return;

        if (!dependencies.isMobile()) {
            dependencies.prepareSpotifyWindow();
        }

        const completed = await dependencies.startNarration(track);

        if (completed) handoff(track);
    }

    async function playSelectedTrack(track: CarModeTrack): Promise<void> {
        abandonCycle();
        dependencies.closeSpotify();
        dependencies.setActivePlayMode('auto');

        if (!dependencies.isMobile()) {
            dependencies.prepareSpotifyWindow();
        }

        const completed = await dependencies.startNarration(track);

        if (completed) handoff(track);
    }

    function handleNext(): void {
        if (dependencies.getActivePlayMode() !== 'auto') {
            void dependencies.nextTrack();
            return;
        }

        const activeRunId = abandonCycle();
        timer = setTimeout(() => {
            if (activeRunId !== runId) return;

            timer = null;
            void advance(activeRunId);
        }, 100);
    }

    function handlePrevious(): void {
        if (dependencies.getActivePlayMode() !== 'auto') {
            void dependencies.previousTrack();
            return;
        }

        const activeRunId = abandonCycle();
        timer = setTimeout(() => {
            if (activeRunId !== runId) return;

            timer = null;
            void dependencies.startPreviousAutoPlayback();
        }, 100);
    }

    return {
        cancel,
        handlePlay,
        handleNext,
        handlePrevious,
        playSelectedTrack,
        interruptSpotifyTrack,
        getInterruptedSpotifyTrack,
        clearInterruptedSpotifyTrack,
        // Backend Radio still owns the next-track choice, but its Spotify
        // handoff must arm the normal guarded duration + buffer completion.
        handoffCurrentTrack: (track: CarModeTrack) => handoff(track)
    };
}
