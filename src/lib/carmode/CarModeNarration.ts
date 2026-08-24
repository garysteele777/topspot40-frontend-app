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
        onTiming: (timing: NarrationTiming) => void
    ) => Promise<void>;
    stopNarration: () => void;
    updateTiming: (timing: NarrationTiming) => void;
    resetTiming: () => void;
    getPlaybackPhase: () => PlaybackPhase;
    setPlaybackPhase: (phase: PlaybackPhase) => void;
    setIsPlaying: (playing: boolean) => void;
    resetGuidedReadyState: () => void;
    setGuidedReady: (ready: boolean) => void;
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

        dependencies.setIsPlaying(true);

        if (narrationSequence.length > 0) {
            await dependencies.unlockBed();

            try {
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
                    await dependencies.playNarration(
                        narration.url,
                        narration.fallbackUrl,
                        dependencies.updateTiming
                    );

                    if (activeRunId !== runId) return false;
                }
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
