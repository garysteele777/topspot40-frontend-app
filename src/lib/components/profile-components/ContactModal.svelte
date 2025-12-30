<script lang="ts">
	export let visible: boolean = false;
	export let onClose: () => void;

	let submitted = false;

	let email = '';
	let message = '';
	let error = '';

	function sendMessage(e: MouseEvent) {
		// (optional) prevent default if inside a form someday
		e.preventDefault();

		if (!email.trim() || !message.trim()) {
			error = 'Please enter both your email and a message.';
			return;
		}
		console.log('Message sent!');
		submitted = true; // switch to thank-you view
		error = '';
		// TODO: send message to backend here
	}

	function handleClose(e?: MouseEvent) {
		e?.preventDefault?.();
		// reset state (no shadowing—do NOT re-declare with `let`)
		submitted = false;
		email = '';
		message = '';
		error = '';
		onClose?.();
	}
</script>

{#if visible}
	<div class="overlay" on:click={handleClose}>
		<div class="popup" on:click|stopPropagation>
			{#if !submitted}
				<h2>Contact Us</h2>
				<p>We’d love to hear from you! Reach out with any questions.</p>

				<input
					type="email"
					bind:value={email}
					placeholder="Your email"
					class="modal-input"
					autocomplete="email"
					aria-label="Your email"
				/>

				<textarea
					rows="4"
					bind:value={message}
					class="modal-textarea"
					placeholder="Your message"
					aria-label="Your message"
				></textarea>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<div class="actions">
					<button type="button" on:click={sendMessage}>Send</button>
					<button type="button" class="secondary" on:click={handleClose}>Cancel</button>
				</div>
			{:else}
				<h2>Thank you!</h2>
				<p>Your message has been sent successfully.</p>
				<div class="actions">
					<button type="button" on:click={handleClose}>Close</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(3px);
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.popup {
		background: #1e1e1e;
		color: white;
		padding: 2rem;
		border-radius: 12px;
		width: 350px;
		text-align: left;
	}
	input,
	textarea {
		width: 100%;
		padding: 0.6rem;
		margin-top: 0.5rem;
		border-radius: 6px;
		border: none;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1rem;
	}
	button {
		padding: 0.6rem 1.2rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	button:first-of-type {
		background: #1db954;
		color: white;
	}
	.secondary {
		background: #444;
		color: white;
	}
	.error {
		color: #ff4d4f;
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}
</style>
