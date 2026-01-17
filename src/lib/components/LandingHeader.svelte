<script>
	// No imports, no components
	console.log('🟢 app layout loaded');

	let showContactUsModal = false;
	let showFeedbackForm = false;
	let showThankYou = false;

	let feedbackText = '';

	function toggleContactUsModal() {
		showContactUsModal = !showContactUsModal;
		// Reset when modal opens/closes
		showFeedbackForm = false;
		showThankYou = false;
		feedbackText = '';
	}

	function openFeedbackForm() {
		showFeedbackForm = true;
		showThankYou = false;
	}

	function submitFeedback() {
		if (feedbackText.trim() === '') return; // simple validation
		showThankYou = true;
		showFeedbackForm = false;
	}

	function closeContactUsModal() {
		showContactUsModal = false;
		//reset
		showFeedbackForm = false;
		showThankYou = false;
		feedbackText = '';
	}
</script>

<!-- Header HTML -->
<nav class="header">
	<div class="logo">
		<a href="/">
			<img src="/favicon.ico" alt="TopSpot40 Logo" />
			<span>TopSpot40</span>
		</a>
	</div>

	<div class="nav-links">
		<a href="#" on:click|preventDefault={toggleContactUsModal}>Contact Us</a>
		<a href="/about">About</a>
		<a href="/signin">Sign In</a>
		<a class="signup" href="/signup-official">Sign Up</a>
	</div>
</nav>

<!-- Page content slot -->
<slot />

{#if showContactUsModal}
	<div class="modal-backdrop" on:click={closeContactUsModal}>
		<div class="modal-content" on:click|stopPropagation>
			<button class="close-btn" on:click={closeContactUsModal} aria-label="Close contact form"
				>&times;</button
			>
			<h2>Contact Us</h2>
			<p>
				Thanks for your interest! Please email us at <a href="mailto:topspot4077@gmail.com"
					>topspot4077@gmail.com</a
				>
			</p>
			<!-- You can replace above with an actual contact form later -->
			{#if showThankYou}
				<h2>Thank You!</h2>
				<p>Your feedback has been successfully sent.</p>
				<button on:click={closeContactUsModal} class="ok-btn">Close</button>
			{:else if showFeedbackForm}
				<h2>Feedback</h2>
				<textarea placeholder="Type your feedback here..." bind:value={feedbackText} rows="6"
				></textarea>
				<button on:click={submitFeedback} class="submit-btn" disabled={feedbackText.trim() === ''}
					>Send Feedback</button
				>
			{:else}
				<button on:click={openFeedbackForm} class="feedback-btn">Send Feedback</button>
			{/if}
		</div>
	</div>
{/if}

<!-- Styling -->
<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: black;
		color: white;
		font-family: system-ui, sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem;
		height: 30px;
		background-color: #000;
		border-bottom: 1px solid #222;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
	}

	.logo a {
		font-weight: bold;
		display: flex;
		gap: 1rem;
		align-items: center;
		font-size: 1rem;
		color: white;
		text-decoration: none;
		letter-spacing: -0.02em;
		line-height: 30px; /* vertically center */
	}

	.logo img {
		height: 20px; /* adjust as needed */
		width: auto;
		display: block;
	}

	.nav-links {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.nav-links a {
		color: #aaa;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.25s ease;
		font-size: 0.8rem;
	}

	.nav-links a.signup:hover {
		color: inherit; /* keep the original text color */
	}

	.nav-links a:hover {
		color: #059669; /* Spotify green */
	}

	.signup {
		border: 1px solid #1db954;
		padding: 0.4rem 1rem;
		border-radius: 9999px;
		color: #1db954;
		font-weight: 700;
	}

	.signup:hover {
		background-color: #1db954;
		color: black;
	}

	/* Modal backdrop fills screen with translucent black */
	.modal-backdrop {
		position: fixed;
		inset: 0; /* top:0; bottom:0; left:0; right:0 */
		background-color: rgba(0, 0, 0, 0.75);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 2000;
	}

	/* Modal container */
	.modal-content {
		background: #121212;
		padding: 2rem;
		border-radius: 1rem;
		max-width: 600px;
		width: 90vw;
		box-shadow: 0 0 15px rgba(29, 185, 84, 0.7);
		color: white;
		position: relative;
		font-family: system-ui, sans-serif;
		text-align: center;
		align-items: center;
	}

	/* Close button top-right corner */
	.close-btn {
		position: absolute;
		top: 0.5rem;
		right: 1rem;
		background: transparent;
		border: 2px solid #1db954;
		border-radius: 50%;
		padding: 0;
		width: 28px;
		aspect-ratio: 1/1;
		color: #1db954;
		font-size: 24px;
		display: flex;
		cursor: pointer;
		line-height: 1;
		font-weight: 700;
		transition: color 0.3s ease;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background-color: #1db954;
		color: black;
		border-color: #22c55e;
	}

	/* Buttons */
	button {
		cursor: pointer;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		padding: 0.75rem 1.5rem;
		margin-top: 1.5rem;
		background-color: #1db954;
		color: black;
		transition: background-color 0.3s ease;
	}

	button:hover:not(:disabled) {
		background-color: #059669;
	}

	button:disabled {
		background-color: #666;
		cursor: not-allowed;
	}

	/* Feedback textarea */
	textarea {
		width: 90%;
		margin-top: 1rem;
		padding: 1rem;
		font-size: 1rem;
		border-radius: 0.5rem;
		border: 1px solid #1db954;
		background-color: #222;
		color: white;
		resize: vertical;
		font-family: system-ui, sans-serif;
	}

	/* Links inside modal */
	a {
		color: #1db954;
		text-decoration: underline;
	}

	.feedback-btn {
		margin-top: 2rem;
		background-color: transparent;
		color: #1db954;
		border: 2px solid #1db954;
		font-weight: 700;
		padding: 0.5rem 1.5rem;
		border-radius: 9999px;
	}
	.feedback-btn:hover {
		background-color: #1db954;
		color: black;
	}
</style>
