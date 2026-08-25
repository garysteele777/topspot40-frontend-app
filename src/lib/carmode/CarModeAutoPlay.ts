import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import type {PlaybackPhase} from '$lib/helpers/car/types';

type AutoPlayMode = 'guided' | 'auto' | null;

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
    openSpotify: () => void;
    closeSpotify: () => void;
    continueAutoPlayback: () => Promise<void>;
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

    function handoff(track: CarModeTrack): void {
        const token = trackToken(track);

        if (
            dependencies.getActivePlayMode() !== 'auto' ||
            handoffToken === token
        ) {
            return;
        }

        handoffToken = token;
        dependencies.openSpotify();
        startTimer(track);
    }

    async function advance(activeRunId: number): Promise<void> {
        if (
            activeRunId !== runId ||
            dependencies.getActivePlayMode() !== 'auto'
        ) {
            return;
        }

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

    async function handlePlay(): Promise<void> {
        const track = dependencies.getCurrentTrack();
        if (!track) return;

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
        handlePlay,
        handleNext,
        handlePrevious,
        playSelectedTrack
    };
}
