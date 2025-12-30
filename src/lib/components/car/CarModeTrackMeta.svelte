<script lang="ts">
	import type { LoadedTrack } from '$lib/utils/normalizeTrack';

	export let currentTrack: LoadedTrack | null = null;
	export let tracks: LoadedTrack[] = [];

	export let elapsed: number = 0;
	export let duration: number = 1;
	export let progress: number = 0;

	// Playback phase from backend
	export let phase: 'idle' | 'bed' | 'intro' | 'detail' | 'artist' | 'track' = 'idle';

	// Title-case helpers
	function toTitleCase(str: string | null | undefined): string {
		if (!str) return '';
		return str
			.split(' ')
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
			.join(' ');
	}

	$: titleCased = toTitleCase(currentTrack?.trackName);
	$: artistCased = toTitleCase(currentTrack?.artistName);

	function formatTime(sec: number): string {
		if (!sec || sec < 0) return '0:00';
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}

	// Pretty phase label
	$: phaseLabel =
		phase === 'intro' ? 'Now playing intro…' :
			phase === 'detail' ? 'Now playing story…' :
				phase === 'artist' ? 'Now playing artist bio…' :
					phase === 'bed' ? 'Starting sequence…' :
						phase === 'track' ? 'Now playing track…' :
							'';

	let expand = false;
</script>

<!-- WRAPPER -->
<div class="w-full flex flex-col items-center mt-6 px-4">

	<!-- META TEXT (centered under cover image) -->
	<div class="meta-under-cover">
		<span class="block text-gray-400 text-sm">
			Rank {currentTrack?.rank ?? '?'} of {tracks.length}
		</span>

<span class="block font-semibold text-lg mt-1 track-title">
	— {titleCased}
</span>


		<div class="text-base text-gray-200 mt-1">
			{artistCased}
		</div>
	</div>


	<!-- PROGRESS BAR -->
	<div class="progress-under-cover">


		<!-- Time left/right -->
		<div class="flex justify-between text-sm text-gray-400 mb-1">
			<span>{formatTime(elapsed)}</span>
			<span>{formatTime(duration)}</span>
		</div>

		<!-- Black bar -->
		<div class="purdue-progress-bg">
			<div class="purdue-progress-fill" style={`width: ${progress}%;`}></div>
		</div>

		<!-- PLATINUM NARRATION DISPLAY -->
		{#if phaseLabel}
			<div class="phase-wrapper" on:click={() => (expand = !expand)}>

				<!-- EQ Bars -->
				<div class="phase-eq">
					<div class="bar b1"></div>
					<div class="bar b2"></div>
					<div class="bar b3"></div>
					<div class="bar b4"></div>
					<div class="bar b5"></div>
				</div>

				<!-- Shimmer Marquee -->
				<div class="phase-label-deluxe">
					<div class="phase-marquee">
						<span>{phaseLabel}</span>
					</div>
				</div>

				<!-- Expandable panel -->
				{#if expand}
					<div class="phase-expand">
						<p>Extra narration info coming soon…</p>
					</div>
				{/if}
			</div>
		{/if}

	</div>
</div>

<style>
:root {
    --purdue-gold: #CFB991;
    --purdue-gold-light: #E8D7A7;
    --purdue-black: #000000;
}

/* Progress background bar */
.purdue-progress-bg {
    width: 100%;
    height: 12px;
    background: var(--purdue-black);
    border-radius: 9999px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
}

/* Gold shimmering progress fill */
.purdue-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--purdue-gold), var(--purdue-gold-light), var(--purdue-gold));
    background-size: 200% 100%;
    animation: gold-shimmer 2.4s infinite linear;
    transition: width 0.25s linear;
}

@keyframes gold-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
}

/* PHASE WRAPPER */
.phase-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 14px;
    animation: fadein 0.35s ease-out;
    cursor: pointer;
}

/* EQ BARS */
.phase-eq {
    display: flex;
    gap: 5px;
    height: 14px;
    margin-bottom: 6px;
}

.phase-eq .bar {
    width: 4px;
    background: var(--purdue-gold-light);
    border-radius: 3px;
    opacity: 0.85;
    animation: eqPulse 1.3s infinite ease-in-out;
}

.b1 { animation-delay: 0s; }
.b2 { animation-delay: 0.12s; }
.b3 { animation-delay: 0.24s; }
.b4 { animation-delay: 0.36s; }
.b5 { animation-delay: 0.48s; }

@keyframes eqPulse {
    0%   { height: 3px; opacity: 0.5; }
    25%  { height: 14px; opacity: 1; }
    50%  { height: 7px; opacity: 0.75; }
    75%  { height: 12px; opacity: 1; }
    100% { height: 3px; opacity: 0.5; }
}

/* SHIMMER MARQUEE */
.phase-label-deluxe {
    position: relative;
    width: 100%;
    overflow: hidden;
    height: 22px;
}

.phase-marquee {
    display: inline-block;
    white-space: nowrap;
    animation: marqueeScroll 7s linear infinite;
}

.phase-marquee span {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.7px;
    background: linear-gradient(90deg, var(--purdue-gold-light), var(--purdue-gold), var(--purdue-gold-light));
    background-size: 200% 100%;
    -webkit-background-clip: text;
    color: transparent;
    animation: goldShimmer 2.5s infinite linear;
    text-shadow:
        0 0 8px rgba(255, 223, 140, 0.4),
        0 0 12px rgba(255, 223, 140, 0.3);
}

@keyframes marqueeScroll {
    from { transform: translateX(100%); }
    to   { transform: translateX(-100%); }
}

@keyframes goldShimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
}

/* Expandable section */
.phase-expand {
    margin-top: 8px;
    padding: 10px;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    color: var(--purdue-gold-light);
    font-size: 0.9rem;
    animation: expandIn 0.3s ease-out;
}

@keyframes expandIn {
    from { opacity: 0; transform: scaleY(0.85); }
    to   { opacity: 1; transform: scaleY(1); }
}

@keyframes fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* Center the rank/title/artist under the album cover */
.meta-under-cover {
    max-width: 320px;
    margin: 0 auto;
    text-align: center;
}

/* Keep the title on a single line */
.track-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Center timers + progress bar under the album cover */
.progress-under-cover {
    max-width: 320px;
    margin: 0 auto;
    text-align: center;
}
</style>

