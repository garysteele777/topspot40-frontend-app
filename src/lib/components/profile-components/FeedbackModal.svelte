<script lang="ts">
	export let visible = false;
	export let onClose: () => void;

	let submitted = false; // track if the user has submitted

	let feedback = '';
	let error = '';

	function submitFeedback() {
		if (!feedback.trim()) {
			error = 'Please write some feedback before submitting.';
			return;
		}
		console.log('Feedback submitted!');
		submitted = true; // switch to thank-you view
		error = '';
		// TODO: send feedback to backend here
	}

	function handleClose() {
		submitted = false;
		feedback = '';
		error = '';
		onClose?.();
	}
</script>

{#if visible}
	<div class="overlay" on:click={handleClose}>
		<div class="popup" on:click|stopPropagation>
			{#if !submitted}
				<h2>Feedback</h2>
				<p>Tell us what you think about TopSpot40.</p>
				<textarea
					rows="4"
					bind:value={feedback}
					class="modal-textarea"
					placeholder="Write your feedback here..."
				></textarea>
				{#if error}
					<p class="error">{error}</p>
				{/if}
				<div class="actions">
					<button on:click={submitFeedback}>Submit</button>
					<button class="secondary" on:click={handleClose}>Cancel</button>
				</div>
			{:else}
				<h2>Thank you!</h2>
				<p>Your feedback has been submitted successfully.</p>
				<div class="actions">
					<button on:click={handleClose}>Close</button>
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
