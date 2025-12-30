<!-- $lib/components/Header.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import DropdownMenu from './DropdownMenu.svelte';
	import { browser } from '$app/environment';
	import ContactModal from './profile-components/ContactModal.svelte';
	import FeedbackModal from './profile-components/FeedbackModal.svelte';

	let dropdownRef: HTMLElement; // reference to the dropdown container
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
	<div class="user-profile" bind:this={dropdownRef} on:click={() => (showDropdown = !showDropdown)}>
		<img src="/user-avatar.png" alt="User" />
		{#if showDropdown}
			<DropdownMenu
				onFeedback={() => {
					showFeedbackModal = true;
					showDropdown = false;
				}}
				onContact={() => {
					console.log('Contact clicked!');
					showContactModal = true;
					showDropdown = false;
				}}
			/>
		{/if}
	</div>
</header>

<!-- Feedback Modal -->
<FeedbackModal visible={showFeedbackModal} onClose={() => (showFeedbackModal = false)} />

<!-- Contact Us Modal -->
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
	}
</style>
