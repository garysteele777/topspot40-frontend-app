<script lang="ts">
	// Props for the parent to handle clicks
	export let onFeedback: () => void;
	export let onContact: () => void;

	function handleClick(type: 'feedback' | 'contact') {
		if (type === 'feedback') onFeedback?.();
		else if (type === 'contact') onContact?.();
	}
</script>

<!-- $lib/components/DropdownMenu.svelte -->
<div class="dropdown-menu" on:click|stopPropagation>
	<ul>
		<li>Manage Account / Subscription</li>
		<li>Stats & Analytics</li>
		<li>Notifications</li>
		<li on:click={() => handleClick('feedback')}>Feedback</li>
		<li on:click={() => handleClick('contact')}>Contact Us</li>
		<li>Logout</li>
	</ul>
</div>

<style>
	.dropdown-menu {
		position: absolute;
		right: 0;
		top: 100%;
		background: #222;
		border-radius: 5px;
		overflow: hidden;
		z-index: 20;
	}

	.dropdown-menu ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.dropdown-menu li {
		padding: 0.8rem 1.5rem;
		cursor: pointer;
	}

	.dropdown-menu li:hover {
		background: #1db954;
	}
</style>
