export type ProgramStartedProperties = Record<string, string | number | null>;

type ProgramStartedTrackerOptions = {
    capture: (properties: ProgramStartedProperties) => void;
    alreadyStarted?: boolean;
};

export function createProgramStartedTracker({
    capture,
    alreadyStarted = false
}: ProgramStartedTrackerOptions) {
    let started = alreadyStarted;

    function captureOnce(properties: ProgramStartedProperties): boolean {
        if (started) return false;

        started = true;
        capture(properties);
        return true;
    }

    function markStarted(): void {
        started = true;
    }

    function hasStarted(): boolean {
        return started;
    }

    return {
        captureOnce,
        markStarted,
        hasStarted
    };
}

type ProgramStartedSelection = {
    programType: string;
    mode: string;
    language: string;
    context?: Record<string, string> | null;
};

type ProgramStartedPlaybackMethod = 'automatic' | 'guided';

export function buildProgramStartedProperties(
    selection: ProgramStartedSelection,
    playbackMethod: ProgramStartedPlaybackMethod
): ProgramStartedProperties {
    const properties: ProgramStartedProperties = {
        program_type: selection.programType,
        mode: selection.mode,
        language: selection.language,
        playback_method: playbackMethod
    };

    const context = selection.context;

    if (context?.decade) {
        properties.decade = context.decade;
    }

    if (context?.genre) {
        properties.genre = context.genre;
    }

    if (context?.collection_slug) {
        properties.collection_slug = context.collection_slug;
    }

    if (context?.collection_group_slug) {
        properties.collection_group_slug = context.collection_group_slug;
    }

    if (context?.artist_id) {
        properties.artist_id = context.artist_id;
    }

    return properties;
}
