// SPA memory only: a fresh program or full browser reload starts a new session.
export const programNarrationMemory: {
    current: {artists: Set<string>; spotlightPlayed: boolean} | null
} = {current: null};
