<script lang="ts">
	import { onMount } from 'svelte';
	import { readLanguagePreference } from '$lib/languagePreferences';

	// Props for the parent to handle clicks
	export let onManageAccount: () => void;
	export let onFeedback: () => void;
	export let onLogout: () => void;

	let language: 'en' | 'es' | 'ptbr' = 'en';

	const copy = {
		en: {
			manageAccount: 'Manage Account / Subscription',
			feedback: 'Feedback',
			logout: 'Logout'
		},
		es: {
			manageAccount: 'Administrar cuenta / suscripción',
			feedback: 'Comentarios',
			logout: 'Cerrar sesión'
		},
		ptbr: {
			manageAccount: 'Gerenciar conta / assinatura',
			feedback: 'Feedback',
			logout: 'Sair'
		}
	} as const;

	$: text = copy[language];

	function handleClick(type: 'manage-account' | 'feedback' | 'logout') {
		if (type === 'manage-account') onManageAccount?.();
		else if (type === 'feedback') onFeedback?.();
		else if (type === 'logout') onLogout?.();
	}

	onMount(() => {
		language = readLanguagePreference();
	});
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
				{text.manageAccount}
			</button>
		</li>

		<li>
			<button type="button" on:click={() => handleClick('feedback')}>
				{text.feedback}
			</button>
		</li>

		<li>
			<button type="button" on:click={() => handleClick('logout')}>
				{text.logout}
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
