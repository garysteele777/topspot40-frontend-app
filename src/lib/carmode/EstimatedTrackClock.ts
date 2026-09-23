export type EstimatedTrackTiming = {
    elapsed: number;
    duration: number;
    progress: number;
};

type EstimatedTrackClockDependencies = {
    setTiming: (timing: EstimatedTrackTiming) => void;
    now?: () => number;
    setInterval?: (callback: () => void, milliseconds: number) => ReturnType<typeof setInterval>;
    clearInterval?: (timer: ReturnType<typeof setInterval>) => void;
};

/**
 * A local display clock for externally played tracks. It deliberately does
 * not claim to be Spotify position; it estimates elapsed time from the
 * successful handoff until the normal Auto Play transition or pause.
 */
export function createEstimatedTrackClock(dependencies: EstimatedTrackClockDependencies) {
    const now = dependencies.now ?? Date.now;
    const schedule = dependencies.setInterval ?? setInterval;
    const cancel = dependencies.clearInterval ?? clearInterval;
    let timer: ReturnType<typeof setInterval> | null = null;
    let startedAt = 0;
    let duration = 0;

    function publish(): void {
        const elapsed = Math.min(duration, Math.max(0, Math.floor((now() - startedAt) / 1000)));
        dependencies.setTiming({
            elapsed,
            duration,
            progress: duration > 0 ? (elapsed / duration) * 100 : 0
        });
    }

    function stop(): void {
        if (timer) cancel(timer);
        timer = null;
    }

    function start(trackDurationSeconds: number): void {
        stop();
        duration = Math.max(0, Math.floor(trackDurationSeconds));
        startedAt = now();
        publish();
        if (duration > 0) timer = schedule(publish, 250);
    }

    return {start, stop};
}
