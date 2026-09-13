import type {
    NarrationPlaybackResult,
    NarrationTiming
} from '$lib/audio/narrationPlayer';
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
        onStarted: () => void
    ) => Promise<NarrationPlaybackResult>;
    stopNarration: () => void;
    updateTiming: (timing: NarrationTiming) => void;
    resetTiming: () => void;
    getPlaybackPhase: () => PlaybackPhase;
    setPlaybackPhase: (phase: PlaybackPhase) => void;
    setIsPlaying: (playing: boolean) => void;
    resetGuidedReadyState: () => void;
    setGuidedReady: (ready: boolean) => void;
    onPlaybackFailure?: () => void;
    onNarrationStart?: (phase: CarModeNarrationPhase, track: CarModeTrack) => void;
};

export function createCarModeNarration(
    dependencies: CarModeNarrationDependencies
) {
    let runId = 0;
    let pausedPhase: 'intro' | 'detail' | null = null;
    let active = false;

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
        active = false;
        dependencies.stopNarration();
        dependencies.stopBed();
        dependencies.resetTiming();
        dependencies.setIsPlaying(false);
        dependencies.setPlaybackPhase('idle');
        dependencies.resetGuidedReadyState();
        pausedPhase = null;
    }

    function suspendForPageHide(): void {
        // Do not leave an iOS-suspended play() promise owning the transport.
        // Completed narration is represented by guidedReady and has no active run.
        if (active) abandon();
    }

    async function start(
        track: CarModeTrack,
        startPhase: 'intro' | 'detail' = 'intro'
    ): Promise<boolean> {
        const activeRunId = ++runId;

        // Every Guided entry shares this coordinator. Tear down an older run
        // before changing phase/track so a late play() resolution cannot leak.
        dependencies.stopNarration();
        dependencies.stopBed();
        dependencies.resetTiming();
        dependencies.resetGuidedReadyState();
        dependencies.setIsPlaying(false);
        dependencies.setPlaybackPhase('idle');
        active = true;

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

        try {
            if (narrationSequence.length > 0) {
                await dependencies.unlockBed();

                await dependencies.startBed(dependencies.getBedUrl(track));

                if (activeRunId !== runId) return false;

                for (const narration of narrationSequence) {
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
                    const result = await dependencies.playNarration(
                        narration.url,
                        narration.fallbackUrl,
                        dependencies.updateTiming,
                        () => {
                            if (activeRunId === runId) {
                                // This is the first point at which the UI may truthfully
                                // offer Pause: HTMLMediaElement.play() has resolved.
                                dependencies.setIsPlaying(true);
                            }
                        }
                    );

                    if (activeRunId !== runId) return false;

                    if (result !== 'ended') {
                        dependencies.setIsPlaying(false);
                        dependencies.setPlaybackPhase('idle');
                        dependencies.resetGuidedReadyState();
                        if (result === 'error') dependencies.onPlaybackFailure?.();
                        return false;
                    }
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
        } catch {
            if (activeRunId === runId) {
                dependencies.setIsPlaying(false);
                dependencies.setPlaybackPhase('idle');
                dependencies.resetGuidedReadyState();
                dependencies.onPlaybackFailure?.();
            }
            return false;
        } finally {
            if (activeRunId === runId) {
                active = false;
                dependencies.stopBed();
                dependencies.resetTiming();
            }
        }
    }

    return {start, pause, takePausedPhase, abandon, suspendForPageHide};
}
