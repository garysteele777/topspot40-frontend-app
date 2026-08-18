<script lang="ts">
	// Props for the parent to handle clicks
	export let onManageAccount: () => void;
	export let onFeedback: () => void;
	export let onContact: () => void;
	export let onLogout: () => void;

	function handleClick(type: 'manage-account' | 'feedback' | 'contact' | 'logout') {
		if (type === 'manage-account') onManageAccount?.();
		else if (type === 'feedback') onFeedback?.();
		else if (type === 'contact') onContact?.();
		else if (type === 'logout') onLogout?.();
	}
</script>

<!-- $lib/components/DropdownMenu.svelte -->

<!--
	This container is not an interactive control.
	It only prevents clicks inside the menu from bubbling upward.
-->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dropdown-menu" on:click|stopPropagation>
	<ul>
		<li>
			<button type="button" on:click={() => handleClick('manage-account')}>
				Manage Account / Subscription
			</button>
		</li>
		<li>Stats & Analytics</li>
		<li>Notifications</li>

		<li>
			<button type="button" on:click={() => handleClick('feedback')}>
				Feedback
			</button>
		</li>

		<li>
			<button type="button" on:click={() => handleClick('contact')}>
				Contact Us
			</button>
		</li>

		<li>
			<button type="button" on:click={() => handleClick('logout')}>
				Logout
			</button>
		</li>
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
		min-width: 220px;
	}

	.dropdown-menu ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.dropdown-menu li {
		padding: 0;
	}

	.dropdown-menu li:hover {
		background: #1db954;
	}

	.dropdown-menu button {
		width: 100%;
		padding: 0.8rem 1.5rem;
		background: transparent;
		border: none;
		color: inherit;
		text-align: left;
		cursor: pointer;
		font: inherit;
	}

	.dropdown-menu button:hover {
		background: #1db954;
	}
</style>