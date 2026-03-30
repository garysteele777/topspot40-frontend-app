<script lang="ts">
    import {fade, fly} from 'svelte/transition';
    import {onMount} from 'svelte';
    import {cubicOut, cubicIn} from 'svelte/easing';
    import {goto} from '$app/navigation';

    let paragraph_message = [
        'Discover and rank the top 40 like never before.',
        'TopSpot 40: Your Countdown Companion.',
        'Ranking Memories, One Track at a Time.',
        'Your favorite countdown, reimagined.',
        'Rediscover the Songs. Remember the Feeling.',
        'Every Track Has a Story. We Tell It.',
        'The countdown you didn’t know you needed.',
        'TopSpot 40: Bringing Your Music Alive.',
        'Where the beat meets the story.',
        'Built for Spotify lovers, by music lovers.'
    ];

    let currentIndex = 0;

    let reviews = [
        {text: 'This app changed how I enjoy music!', author: 'Jamie D.'},
        {text: 'The countdown format is brilliant. Nostalgic & fresh.', author: 'Leo M.'},
        {text: 'Finally, a way to rank and relive my favorite decades.', author: 'Avery T.'}
    ];

    let currentReview = 0;
    let reviewInterval: ReturnType<typeof setInterval>;

    let abstract_album_music_images = [
        '/images_music/blocks-T3mKJXfdims-unsplash.jpg',
        '/images_music/clay-banks-fEVaiLwWvlU-unsplash.jpg',
        '/images_music/jens-riesenberg-PZ7HxI8tW_E-unsplash.jpg',
        '/images_music/marcela-laskoski-YrtFlrLo2DQ-unsplash.jpg',
        '/images_music/namroud-gorguis-FZWivbri0Xk-unsplash.jpg',
        '/vinyl_images/kevin-grieve-dksWRPKtW1Q-unsplash.jpg',
        '/vinyl_images/mink-mingle-HRyjETL87Gg-unsplash.jpg'
    ];

    let listening_images = [
        '/images_of_listening_to_music/ben-blennerhassett-LR5eS1C9IUU-unsplash.jpg',
        '/images_of_listening_to_music/ilias-chebbi-2gpfqhEFVZ8-unsplash.jpg',
        '/images_of_listening_to_music/rupam-dutta-5OMff2RDqPs-unsplash.jpg'
    ];

    let currentAlbumIndex = 0;
    let albumInterval: ReturnType<typeof setInterval>;

    let currentListenerIndex = 0;
    let listenerInterval: ReturnType<typeof setInterval>;


    function go(path: string) {
        goto(path);
    }


    onMount(() => {
        albumInterval = setInterval(() => {
            currentAlbumIndex = (currentAlbumIndex + 1) % abstract_album_music_images.length;
        }, 5000);
        return () => clearInterval(albumInterval);
    });

    onMount(() => {
        listenerInterval = setInterval(() => {
            currentListenerIndex = (currentListenerIndex + 1) % listening_images.length;
        }, 5000);
        return () => clearInterval(listenerInterval);
    });

    onMount(() => {
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % paragraph_message.length;
        }, 6000);
        return () => clearInterval(interval);
    });

    onMount(() => {
        reviewInterval = setInterval(() => {
            currentReview = (currentReview + 1) % reviews.length;
        }, 6000);
        return () => clearInterval(reviewInterval);
    });
</script>

<div class="hero-section">
    <div class="hero-logo">
        <a href="/app" class="logo">
            <img src="/favicon.ico" alt="TopSpot40 Logo"/>
        </a>
    </div>
    <main>
        <h1>Welcome to TopSpot40.com</h1>
        <div class="message-container">
            {#key currentIndex}
                <p
                        class="gradient-reveal"
                        in:fly={{ y: 14, duration: 260, easing: cubicOut }}
                        out:fly={{ y: -10, duration: 180, easing: cubicIn }}
                >
                    {paragraph_message[currentIndex]}
                </p>
            {/key}
        </div>
        <div class="cta-buttons">
            <a href="/demo" class="demo">Try Demo</a>
        </div>
    </main>


    <!-- TEMPORARY BLOCK/BUTTON!-->
    <div class="temporary-button-group">
        <button on:click={() => go('/options-v2')}>
            Options V2
        </button>

        <button on:click={() => go('/options-v3')}>
            Options V3
        </button>
    </div>


    <section class="features">
        <div class="features-grid">
            <div class="feature-card" tabindex="0">
                <div class="icon">🎵</div>
                <h3>Personalized Rankings</h3>
                <p>Discover your unique countdowns based on your Spotify history.</p>
            </div>
            <div class="feature-card" tabindex="0">
                <div class="icon">⚡</div>
                <h3>Fast & Easy</h3>
                <p>Instant access to your top 40 songs with smooth playback and intuitive controls.</p>
            </div>
            <div class="feature-card" tabindex="0">
                <div class="icon">📅</div>
                <h3>Decades Reimagined</h3>
                <p>Relive the best tracks of your favorite decades with a fresh perspective.</p>
            </div>
            <div class="feature-card" tabindex="0">
                <div class="icon">🌟</div>
                <h3>Exclusive Content</h3>
                <p>Enjoy unique insights, artist stories, and curated playlists only on TopSpot40.</p>
            </div>
            <div class="feature-card" tabindex="0">
                <div class="icon">🔒</div>
                <h3>Secure & Private</h3>
                <p>Your data is safe with us — we never share your personal info or listening habits.</p>
            </div>
            <div class="feature-card" tabindex="0">
                <div class="icon">💡</div>
                <h3>Smart Recommendations</h3>
                <p>Discover new tracks and artists based on your top 40 and listening trends.</p>
            </div>
        </div>
    </section>

    <!-- People Listening images Section -->
    <div class="listening-section">
        {#each listening_images as listener_image (listener_image)}
            <img src={listener_image} alt="Listener" class="listener-image"/>
        {/each}
    </div>
</div>

<div class="marquee-wrapper">
    <div class="hero-image">
        <!-- doubled array already has a key (index) -->
        {#each [...abstract_album_music_images, ...abstract_album_music_images] as album_image, index (index)}
            <img src={album_image} alt="Album" class="hero-album"/>
        {/each}
    </div>
</div>

<!-- Review Carousel -->
<section class="review-carousel">
    {#if reviews.length > 0}
        <div class="review-card" transition:fade>
            <p class="quote">"{reviews[currentReview].text}"</p>
            <p class="author">— {reviews[currentReview].author}</p>
        </div>
    {:else}
        <p class="quote">More reviews coming soon...</p>
    {/if}
</section>

<footer class="disclaimer">
    <p>
        <strong>Disclaimer:</strong> TopSpot is currently in development. You must have a valid Spotify Premium
        account to use TopSpot when it launches. TopSpot does not provide Spotify Premium access or subscriptions.
    </p>
    <p class="creators">Gary Steele, Isaiah Trevino, and Patricia Steele</p>
</footer>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background-color: #121212;
        color: white;
        font-family: 'Inter', sans-serif;
    }

    .hero-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 4rem 2rem;
        text-align: center;
        background: radial-gradient(circle at 30% 30%, #1db954 5%, #121212 90%);
    }

    .hero-section h1 {
        font-size: 4rem;
        font-weight: 800;
        margin-bottom: 1.5rem;
        letter-spacing: -0.5px;
        line-height: 1.2;
    }

    .hero-section p {
        font-size: 1.25rem;
        font-weight: 500;
        line-height: 1.6;
        max-width: 600px;
        margin: 0 auto 2rem auto;
        text-align: center;
        letter-spacing: 0.2px;

        background: linear-gradient(90deg, #a7f3d0, #ffffff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        color: #c2fbd7;
    }

    .creators {
        font-size: 0.75rem;
        color: #666;
        margin-top: 0.5rem;
        font-style: italic;
    }

    .message-container {
        min-height: 3.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    @keyframes revealText {
        from {
            background-position: 100% 0;
            opacity: 0;
        }
        to {
            background-position: 0 0;
            opacity: 1;
        }
    }

    .gradient-reveal {
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.6;
        max-width: 700px;
        margin: 0 auto 2rem auto;
        text-align: center;
        letter-spacing: 0.3px;

        background: linear-gradient(90deg, #a7f3d0, #ffffff);
        background-size: 200% auto;
        background-position: 100% 0;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        animation: revealText 2.5s ease-out forwards;
    }

    .disclaimer {
        position: relative;
        background-color: #111;
        color: #ccc;
        font-size: 0.8rem;
        text-align: center;
        padding: 2rem 1rem 1rem;
        border-top: 1px solid #222;
        overflow: hidden;
    }

    .disclaimer strong {
        color: #fff;
    }

    footer {
        opacity: 0;
        animation: fadeInFooter 1.2s ease-out forwards;
        animation-delay: 0.6s;
    }

    @keyframes fadeInFooter {
        to {
            opacity: 1;
        }
    }

    .hero-logo .logo img {
        display: inline-block;
        vertical-align: middle;
        height: 48px;
        width: auto;
        border: none;
    }

    .hero-logo .logo {
        line-height: 0;
    }

    .review-carousel {
        width: 100%;
        max-width: 800px;
        margin: 4rem auto;
        text-align: center;
        padding: 2rem;
        background: #1a1a1a;
        border-radius: 1rem;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }

    .review-card {
        animation: fadeInSlide 1s ease-out;
    }

    .quote {
        font-size: 1.5rem;
        font-style: italic;
        margin-bottom: 1rem;
        color: #f1f1f1;
    }

    .author {
        font-size: 1rem;
        color: #888;
    }

    @keyframes fadeInSlide {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .demo {
        display: inline-block;
        padding: 0.75rem 2rem;
        background-color: #1db954;
        color: white;
        font-weight: 600;
        border-radius: 9999px;
        text-decoration: none;
        font-size: 1rem;
        box-shadow: 0 2px 8px rgb(37 99 235 / 0.4);
        transition: background-color 0.3s ease,
        box-shadow 0.3s ease;
        margin-top: 0.5rem;
    }

    .demo:hover {
        background-color: #059669;
    }

    .marquee-wrapper {
        overflow: hidden;
        width: 100vw;
        padding: 4rem 0;
        background: linear-gradient(to right, #0f0f0f, #1c1c1c);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .hero-image {
        display: flex;
        gap: 2rem;
        width: max-content;
        animation: scrollLeft 60s linear infinite;
        align-items: center;
    }

    .hero-album {
        height: 420px;
        width: 420px;
        object-fit: cover;
        border-radius: 1rem;
        flex-shrink: 0;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
    }

    @keyframes scrollLeft {
        0% {
            transform: translateX(0%);
        }
        100% {
            transform: translateX(-50%);
        }
    }

    .hero-album:hover {
        transform: scale(1.05);
    }

    .listening-section {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1.5rem;
        margin: 4rem auto;
        max-width: 1000px;
        padding: 1rem;
    }

    .listener-image {
        width: 220px;
        height: 220px;
        object-fit: cover;
        border-radius: 1rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
    }

    .listener-image:hover {
        transform: scale(1.05);
    }

    .features {
        max-width: 1200px;
        margin: 5rem auto;
        padding: 0 1rem;
        text-align: center;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 3rem;
    }

    .feature-card {
        background: #222;
        padding: 2.5rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease,
        box-shadow 0.3s ease;
        cursor: default;
        outline-offset: 4px;
    }

    .feature-card:focus,
    .feature-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 8px 25px rgba(29, 185, 84, 0.7);
    }

    .icon {
        font-size: 3.5rem;
        margin-bottom: 1rem;
        color: #1db954;
        user-select: none;
    }

    .feature-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        color: white;
    }

    .feature-card p {
        font-size: 1rem;
        color: #ccc;
        line-height: 1.5;
        user-select: none;
    }


    .temporary-button-group {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1rem;
    }

    .temporary-button-group button {
        background-color: #1db954;
        color: white;
        padding: 0.5rem 1.2rem;
        border-radius: 9999px;
        font-weight: 600;
        cursor: pointer;
    }

    .temporary-button-group button:hover {
        background-color: #059669;
    }


</style>
