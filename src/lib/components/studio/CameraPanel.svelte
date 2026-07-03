<script lang="ts">
    import {onMount, onDestroy, tick} from 'svelte';

    let videoEl: HTMLVideoElement;
    let stream: MediaStream | null = null;
    let cameraError = '';

    onMount(async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

            await tick();

            if (videoEl) {
                videoEl.srcObject = stream;
                videoEl.muted = true;
                videoEl.playsInline = true;

                await videoEl.play().catch(err => {
                    console.warn('Video play failed:', err);
                });
            }
        } catch (err) {
            console.error('Camera unavailable:', err);
            cameraError = 'Camera unavailable';
        }
    });

    onDestroy(() => {
        stream?.getTracks().forEach(track => track.stop());
    });
</script>

<section class="camera-panel">
    {#if cameraError}
        <div class="old-dog-fallback">
            <div class="dog">🐶</div>
            <div class="brand">OLD DOG</div>
            <div class="tagline">New Tracks</div>
            <div class="site">TOPSPOT40.COM</div>
        </div>
    {:else}
        <video
                bind:this={videoEl}
                autoplay
                muted
                playsinline
        ></video>
    {/if}
</section>

<style>
    .camera-panel {
        border: 1px solid rgba(207, 184, 124, 0.35);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.04);
        min-height: 140px;

        width: 40%;
        margin: 0 auto;

        display: grid;
        place-items: center;
        text-align: center;
        padding: 1.25rem;
        overflow: hidden;
    }

    video {
        width: 100%;
        height: auto;
        display: block;
        border-radius: 14px;
    }

    .old-dog-fallback {
        height: 100%;
        min-height: 180px;
        display: grid;
        place-items: center;
        text-align: center;
    }

    .dog {
        font-size: 2rem;
        margin-bottom: 0.35rem;
    }

    .brand {
        color: #cfb87c;
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: 0.04em;
    }

    .tagline {
        margin-top: 0.4rem;
        font-weight: 700;
    }

    .site {
        margin-top: 0.9rem;
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        opacity: 0.8;
    }
</style>