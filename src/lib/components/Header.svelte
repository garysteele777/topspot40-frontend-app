<!-- $lib/components/Header.svelte -->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	import DropdownMenu from './DropdownMenu.svelte';
	import ContactModal from './profile-components/ContactModal.svelte';
	import FeedbackModal from './profile-components/FeedbackModal.svelte';

	let dropdownRef: HTMLButtonElement;

	let showDropdown = false;
	let showFeedbackModal = false;
	let showContactModal = false;

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			showDropdown = false;
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<header class="header">
	<div class="logo">TopSpot40</div>

	<button
		type="button"
		class="user-profile"
		bind:this={dropdownRef}
		on:click={() => (showDropdown = !showDropdown)}
		aria-expanded={showDropdown}
		aria-haspopup="menu"
	>
		<img src="/user-avatar.png" alt="User" />

		{#if showDropdown}
			<DropdownMenu
				onFeedback={() => {
					showFeedbackModal = true;
					showDropdown = false;
				}}
				onContact={() => {
					showContactModal = true;
					showDropdown = false;
				}}
			/>
		{/if}
	</button>
</header>

<FeedbackModal visible={showFeedbackModal} onClose={() => (showFeedbackModal = false)} />

<ContactModal visible={showContactModal} onClose={() => (showContactModal = false)} />

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: #121212;
		color: white;
	}

	.user-profile {
		position: relative;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		color: inherit;
	}
</style>