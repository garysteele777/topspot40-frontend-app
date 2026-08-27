<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { Music, Zap, Calendar, Radio, Lock, Lightbulb } from 'lucide-svelte';

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

	let steps = [
		{ title: 'Sign in to TopSpot40', description: 'Open selected tracks in Spotify while TopSpot40 guides the story, ranking, and context.' },
		{ title: 'Choose genre + decade', description: 'Pick Pop, Rock, Country, RnB/Soul, or Blues/Jazz and select a decade.' },
		{ title: 'Select Language', description: 'Select English, Spanish, or Portuguese'},
		{ title: 'Select listening mode', description: 'Radio Mode, DJ Mode, or Story Mode — each changes how tracks are introduced.' },
		{ title: 'Pick playback style', description: 'Countdown, count-up, or shuffle — like real radio chart formats.' },
		{ title: 'Press play', description: 'Listen to your Top 40 countdown with intros and context.' }
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
			<img src="/old-dog-icon.png" alt="TopSpot40 Logo" />
		</a>
	</div>
	<main>
		<h1>Welcome to TopSpot40</h1>
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
	<div class="temporary-button">
    	<button on:click={() => go('/options-v4')}>Go to Options</button>
	</div>






	<section class="features">
		<div class="features-grid">
			<div class="feature-card" tabindex="0">
				<div class="icon">
					<div class="icon-wrapper">
						<Music size={36} color="#1db954" />
					</div>
				</div>
				<h3>Top 40 Rankings</h3>
				<p>Top 40 songs ranked for every genre and decade.</p>
			</div>
			<div class="feature-card" tabindex="0">
				<div class="icon">
					<div class="icon-wrapper">
						<Zap size={36} color="#1db954" />
					</div>
				</div>
				<h3>Fast & Easy</h3>
				<p>Explore curated Top 40 programs with rankings, context, and direct Spotify links.</p>
			</div>
			<div class="feature-card" tabindex="0">
				<div class="icon">
					<div class="icon-wrapper">	
						<Calendar size={36} color="#1db954" />
					</div>
				</div>
				<h3>Decades Reimagined</h3>
				<p>Relive the best songs of your favorite decades with a fresh perspective.</p>
			</div>
			<div class="feature-card" tabindex="0">
				<div class="icon">
					<div class="icon-wrapper">
						<Radio size={36} color="#1db954" />
					</div>
				</div>
				<h3>AI Radio Host</h3>
				<p>Enjoy unique insights, intros, artist stories, and transitions between songs, only on TopSpot40.</p>
			</div>
			<div class="feature-card" tabindex="0">
				<div class="icon">
					<div class="icon-wrapper">
						<Lock size={36} color="#1db954" />
					</div>
				</div>
				<h3>Spotify Companion</h3>
				<p>Open tracks in Spotify. Spotify handles playback, advertisements, and account rules.</p>
			</div>
			<div class="feature-card" tabindex="0">
				<div class="icon">
					<div class="icon-wrapper">
						<Lightbulb size={36} color="#1db954" />
					</div>
				</div>
				<h3>Nostalgia On Demand</h3>
				<p>Jump into 70s rock, 80s pop, 2000s country, and more.</p>
			</div>
		</div>
	</section>


<section class="how-it-works">
    <h2>How TopSpot40 works</h2>
    <div class="how-flow">
        {#each steps as step, i}
            <div class="flow-step">
                <div class="step-number">{i + 1}</div>
                <div class="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                </div>
            </div>
        {/each}
    </div>
</section>




	<!-- People Listening images Section -->
	<div class="listening-section">
		{#each listening_images as listener_image (listener_image)}
			<img src={listener_image} alt="Listener" class="listener-image" />
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
        <strong>Disclaimer:</strong> TopSpot40 is an interactive music discovery guide and companion. Spotify handles music playback, advertisements, and Spotify account behavior. TopSpot40 does not include a Spotify Premium subscription.
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
        background-clip: text;
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
        background-clip: text;
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
		transition:
			background-color 0.3s ease,
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
		transition:
			transform 0.3s ease,
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
		margin-bottom: 1.25rem; 
		display: flex;
		justify-content: center;
	}
	.icon-wrapper {
		background: rgba(29, 185, 84, 0.15);
		border: 1px solid rgba(29, 185, 84, 0.3);
		border-radius: 16px;
		padding: 16px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
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


.temporary-button button {
    background-color: #1db954;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-weight: 600;
    cursor: pointer;
    margin: 1rem auto;
    display: block;
}

.temporary-button button:hover {
    background-color: #059669;
}




.how-it-works {
    max-width: 700px;
    margin: 6rem auto;
    padding: 3rem 2.5rem;
	background: #1a1a1a;
	border-radius: 1.5rem;
	border: 1px solid #2a2a2a;
}

.how-it-works h2 {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 3rem;
	color: white;
}

.how-flow {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.flow-step {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    position: relative;
    padding-bottom: 2.5rem;
}

/* Vertical connecting line */
.flow-step:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 19px;
    top: 40px;
    width: 2px;
    height: calc(100% - 10px);
    background: linear-gradient(to bottom, #1db954, rgba(29,185,84,0.1));
}

.step-number {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 50%;
    background: #1db954;
    color: #000;
    font-weight: 800;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 12px rgba(29, 185, 84, 0.5);
}

.step-content {
    padding-top: 0.5rem;
}

.step-content h3 {
    margin: 0 0 0.4rem 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: white;
	text-align: left;
}

.step-content p {
    margin: 0;
    color: #aaa;
    font-size: 0.95rem;
    line-height: 1.6;
    background: none;
    -webkit-text-fill-color: #aaa;
	text-align: left;
}






</style>
