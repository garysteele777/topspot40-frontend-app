import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import {markRankPlayed, type ProgramKey} from '$lib/carmode/programHistory';
import type {PlaybackSettings} from '$lib/stores/playbackSettings.store';
import type {SelectionState} from '$lib/stores/selection';

type NarrationStopOptions = {
    resolvePhase?: boolean;
    preserveResolve?: boolean;
};

export type CarModeNavigationDependencies = {
    getCurrentTrack: () => CarModeTrack | null;
    getTracks: () => CarModeTrack[];
    getSelection: () => SelectionState | null;
    getPlaybackSettings: () => PlaybackSettings;
    setCurrentTrack: (track: CarModeTrack) => void;
    setCurrentRank: (rank: number) => void;
    stopNarrationAudio: () => void;
    stopCurrentNarrationPhase: (options?: NarrationStopOptions) => void;
    stopBed: () => void;
    stopPlayback: () => Promise<void>;
    markUserStartedPlayback: () => void;
    setUserStartedPlayback: (started: boolean) => void;
    playTrack: (track: CarModeTrack) => Promise<void>;
    startAutoPlay: () => Promise<void>;
};

export function createCarModeNavigation(
    dependencies: CarModeNavigationDependencies
) {
    let nextTrackLock = false;
    let playedRanks: number[] = [];

    function setPlayedRanks(ranks: number[]): void {
        playedRanks = ranks;
    }

    function resetPlayedRanks(): void {
        playedRanks = [];
    }

    function historyKey(
        selection: SelectionState,
        track: CarModeTrack
    ): ProgramKey | null {
        if (selection.mode === 'collection') {
            const slug = selection.context?.collection_slug;
            const group = selection.context?.collection_group_slug;

            return slug && group ? `COL|${slug}|${group}` : null;
        }

        if (selection.mode === 'decade_genre') {
            const decade = track.decadeSlug;
            const genre = track.genreSlug;

            return decade && genre ? `DG|${decade}|${genre}` : null;
        }

        return null;
    }

    async function jumpTo(track: CarModeTrack): Promise<void> {
        await dependencies.stopPlayback();
        dependencies.setCurrentTrack(track);
        dependencies.setCurrentRank(track.rank);
        dependencies.markUserStartedPlayback();
        await dependencies.playTrack(track);
        dependencies.setUserStartedPlayback(true);
    }

    async function next(releaseAutoLock = false): Promise<void> {
        if (nextTrackLock) return;
        nextTrackLock = true;

        dependencies.stopCurrentNarrationPhase({resolvePhase: false});
        dependencies.stopBed();
        await dependencies.stopPlayback();

        const current = dependencies.getCurrentTrack();
        const tracks = dependencies.getTracks();

        if (!current || tracks.length === 0) return;

        const rankingId = current.rankingId;
        const rank = current.rank;

        if (rankingId == null && rank == null) return;

        const playedKey = rankingId ?? rank;

        if (playedKey != null && !playedRanks.includes(playedKey)) {
            playedRanks.push(playedKey);
        }

        const selection = dependencies.getSelection();
        if (selection) {
            const key = historyKey(selection, current);
            if (key) markRankPlayed(key, current.rank);
        }

        const isRadio =
            selection?.programType === 'RADIO_DG' ||
            selection?.programType === 'RADIO_COL' ||
            selection?.programType === 'RADIO_ARTIST';

        if (!isRadio) {
            const settings = dependencies.getPlaybackSettings();
            const orderedTracks = [...tracks];

            if (settings.playbackOrder === 'down') {
                orderedTracks.sort((a, b) => b.rank - a.rank);
            } else if (settings.playbackOrder === 'up') {
                orderedTracks.sort((a, b) => a.rank - b.rank);
            }

            const currentIndex =
                rankingId != null
                    ? orderedTracks.findIndex(track => track.rankingId === rankingId)
                    : orderedTracks.findIndex(track => track.rank === rank);

            if (currentIndex === -1) return;

            let nextTrack = settings.skipPlayed
                ? orderedTracks
                    .slice(currentIndex + 1)
                    .find(track => !playedRanks.includes(track.rank))
                : null;

            if (!nextTrack) {
                nextTrack = orderedTracks[(currentIndex + 1) % orderedTracks.length];
            }

            dependencies.setCurrentRank(nextTrack.rank);
            dependencies.setCurrentTrack(nextTrack);

            await new Promise(resolve => setTimeout(resolve, 50));

            dependencies.markUserStartedPlayback();
            const playback = dependencies.playTrack(nextTrack);
            if (releaseAutoLock) {
                nextTrackLock = false;
            }
            await playback;
            dependencies.setUserStartedPlayback(true);
        }

        if (!releaseAutoLock) {
            setTimeout(() => {
                nextTrackLock = false;
            }, 500);
        }
    }

    async function previous(startAutoPlay = false): Promise<void> {
        const current = dependencies.getCurrentTrack();
        const tracks = dependencies.getTracks();

        if (!current || tracks.length === 0) return;

        dependencies.stopNarrationAudio();
        dependencies.stopCurrentNarrationPhase();
        dependencies.stopBed();
        await dependencies.stopPlayback();

        const rankingId = current.rankingId;
        if (rankingId == null) return;

        const currentIndex = tracks.findIndex(
            track => track.rankingId === rankingId
        );
        if (currentIndex === -1) return;

        const previousTrack = tracks[
            (currentIndex - 1 + tracks.length) % tracks.length
        ];

        dependencies.setCurrentRank(previousTrack.rank);
        dependencies.setCurrentTrack(previousTrack);

        await new Promise(resolve => setTimeout(resolve, 50));

        dependencies.markUserStartedPlayback();
        if (startAutoPlay) {
            void dependencies.startAutoPlay();
        } else {
            await dependencies.playTrack(previousTrack);
        }
        dependencies.setUserStartedPlayback(true);
    }

    return {jumpTo, next, previous, setPlayedRanks, resetPlayedRanks};
}
