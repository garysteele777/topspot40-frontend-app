<script lang="ts">
	import { submitFeedback as submitFeedbackRequest } from '$lib/api/feedback';
	import posthog from 'posthog-js';

	export let visible = false;
	export let onClose: () => void;

	let submitted = false;
	let submitting = false;

	let feedback = '';
	let error = '';

	async function submitFeedback() {
		if (!feedback.trim()) {
			error = 'Please write some feedback before submitting.';
			return;
		}

		error = '';
		submitting = true;

		try {
			await submitFeedbackRequest({
				type: 'feedback',
				category: 'general_feedback',
				message: feedback.trim(),
				route: window.location.pathname
			});

			try {
			        posthog.capture('feedback_submitted', {
			                source: 'profile_feedback',
			                category: 'general_feedback'
			        });
			} catch (analyticsError) {
			        console.error('Unable to record feedback submission:', analyticsError);
			}

			submitted = true;
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: 'Unable to submit feedback. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function handleClose() {
		submitted = false;
		submitting = false;
		feedback = '';
		error = '';

		onClose?.();
	}
</script>

{#if visible}
	<!--
		The overlay closes the modal when clicked.
		This is modal layout behavior, not a button control.
	-->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="overlay" on:click={handleClose}>
		<!--
			The popup prevents clicks inside the modal from bubbling upward.
			This is intentional structural event handling.
		-->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
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
					<button type="button" on:click={submitFeedback} disabled={submitting}>
						{submitting ? 'Submitting...' : 'Submit'}
					</button>

					<button type="button" class="secondary" on:click={handleClose} disabled={submitting}>
						Cancel
					</button>
				</div>
			{:else}
				<h2>Thank you!</h2>
				<p>Your feedback has been submitted successfully.</p>

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

	button:disabled {
		cursor: not-allowed;
		opacity: 0.65;
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
