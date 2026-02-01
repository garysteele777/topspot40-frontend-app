<script lang="ts">
    import MiniPlayer from '$lib/components/MiniPlayer.svelte';
    import CarModeTrackMeta from './CarModeTrackMeta.svelte';
    import CarModeNarration from './CarModeNarration.svelte';
    import CarModeNarrationModal from './CarModeNarrationModal.svelte';
    import CarModeTicker from './CarModeTicker.svelte';

    export let currentTrack;
    export let tracks;
    export let isPlaying;
    export let elapsed;
    export let duration;
    export let progress;
    export let phase;

    export let onPrev;
    export let onNext;
    export let onPlayPause;
    export let onBackToOptions;
    export let showNarrationModal;
    export let setShowNarrationModal;
</script>

<div class="w-full flex flex-col items-center">
    <div class="w-full max-w-xl mx-auto">
        <MiniPlayer
            coverUrl={currentTrack?.albumArtwork ?? '/default_album.png'}
            trackTitle={currentTrack?.trackName}
            artistName={currentTrack?.artistName}
            {isPlaying}
            onPrev={onPrev}
            onNext={onNext}
            onPlayPause={onPlayPause}
            hideMeta={true}
        />
    </div>

    <div class="w-full flex justify-center px-4 mt-4">
        <div class="w-full max-w-xl">
            <CarModeTrackMeta
                {currentTrack}
                {tracks}
                {elapsed}
                {duration}
                {progress}
                {phase}
            />
        </div>
    </div>

    <CarModeTicker text={phase} />

    <div class="w-full flex justify-center px-4 mt-4">
        <CarModeNarration
            track={currentTrack}
            onBackToOptions={onBackToOptions}
            onOpenModal={() => setShowNarrationModal(true)}
        />
    </div>

    <CarModeNarrationModal
        track={currentTrack}
        open={showNarrationModal}
        onClose={() => setShowNarrationModal(false)}
    />
</div>
