import type {NarrationTiming} from '$lib/audio/narrationPlayer';
import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import type {PlaybackPhase} from '$lib/helpers/car/types';

export type CarModeNarrationPhase = 'intro' | 'detail' | 'artist';
export type CarModeNarrationEntry = {
    phase: CarModeNarrationPhase;
    url: string;
    fallbackUrl?: string;
};

export type CarModeNarrationDependencies = {
    getCurrentTrack: () => CarModeTrack | null;
    getNarrations: (track: CarModeTrack) => CarModeNarrationEntry[];
    getBedUrl: (track: CarModeTrack) => string;
    unlockBed: () => Promise<void>;
    startBed: (url: string) => Promise<void>;
    stopBed: () => void;
    playNarration: (
        url: string,
        fallbackUrl: string | undefined,
        onTiming: (timing: NarrationTiming) => void,
        onPlaybackStarted: () => void
    ) => Promise<void>;
    stopNarration: () => void;
    updateTiming: (timing: NarrationTiming) => void;
    resetTiming: () => void;
    getPlaybackPhase: () => PlaybackPhase;
    setPlaybackPhase: (phase: PlaybackPhase) => void;
    setIsPlaying: (playing: boolean) => void;
    resetGuidedReadyState: () => void;
    setGuidedReady: (ready: boolean) => void;
    onNarrationStart?: (phase: CarModeNarrationPhase, track: CarModeTrack) => void;
};

export function createCarModeNarration(
    dependencies: CarModeNarrationDependencies
) {
    let runId = 0;
    let pausedPhase: 'intro' | 'detail' | null = null;

    const trackToken = (track: CarModeTrack): string =>
        `${track.rankingId ?? track.rank}|${track.spotifyTrackId ?? ''}`;

    function invalidate(): void {
        runId += 1;
    }

    function pause(): void {
        const phase = dependencies.getPlaybackPhase();

        invalidate();
        dependencies.stopNarration();
        dependencies.stopBed();
        dependencies.setIsPlaying(false);
        pausedPhase = phase === 'detail' ? 'detail' : 'intro';
    }

    function takePausedPhase(): 'intro' | 'detail' | null {
        const phase = pausedPhase;
        pausedPhase = null;
        return phase;
    }

    function abandon(): void {
        invalidate();
        dependencies.stopNarration();
        dependencies.stopBed();
        dependencies.resetTiming();
        dependencies.setIsPlaying(false);
        pausedPhase = null;
    }

    async function start(
        track: CarModeTrack,
        startPhase: 'intro' | 'detail' = 'intro'
    ): Promise<boolean> {
        const activeRunId = ++runId;

        dependencies.resetGuidedReadyState();

        const token = trackToken(track);
        const narrations = dependencies.getNarrations(track);
        const narrationStartIndex = narrations.findIndex(
            narration => narration.phase === startPhase
        );
        const narrationSequence =
            startPhase === 'detail'
                ? narrationStartIndex === -1
                    ? []
                    : narrations.slice(narrationStartIndex)
                : narrations;

        // Do not show Pause until the narration element confirms playback.
        dependencies.setIsPlaying(false);

        if (narrationSequence.length > 0) {
            try {
                for (const [index, narration] of narrationSequence.entries()) {
                    const activeTrack = dependencies.getCurrentTrack();

                    if (
                        !activeTrack ||
                        trackToken(activeTrack) !== token ||
                        activeRunId !== runId
                    ) {
                        return false;
                    }

                    dependencies.setPlaybackPhase(narration.phase);
                    dependencies.onNarrationStart?.(narration.phase, track);
                    // Calling playNarration creates the element and invokes play() before
                    // its returned promise is awaited, preserving the tap's iPhone activation.
                    const narrationPlayback = dependencies.playNarration(
                        narration.url,
                        narration.fallbackUrl,
                        dependencies.updateTiming,
                        () => {
                            const currentTrack = dependencies.getCurrentTrack();
                            if (
                                activeRunId === runId &&
                                currentTrack &&
                                trackToken(currentTrack) === token
                            ) {
                                dependencies.setIsPlaying(true);
                            }
                        }
                    );

                    if (index === 0) {
                        // Bed audio is optional. Start it after narration play() has been
                        // invoked and never await or allow a bed failure to block narration.
                        try {
                            void dependencies.unlockBed()
                                .then(() => {
                                    if (activeRunId !== runId) return;
                                    return dependencies.startBed(dependencies.getBedUrl(track));
                                })
                                .catch(() => undefined);
                        } catch {
                            // A synchronous bed setup failure is also non-blocking.
                        }
                    }

                    await narrationPlayback;

                    if (activeRunId !== runId) return false;
                }
            } catch (error) {
                dependencies.setIsPlaying(false);
                throw error;
            } finally {
                dependencies.stopBed();
                dependencies.resetTiming();
            }
        }

        const activeTrack = dependencies.getCurrentTrack();

        if (
            !activeTrack ||
            trackToken(activeTrack) !== token ||
            activeRunId !== runId
        ) {
            return false;
        }

        dependencies.setIsPlaying(false);
        dependencies.setPlaybackPhase('track');
        dependencies.setGuidedReady(true);
        return true;
    }

    return {start, pause, takePausedPhase, abandon};
}
