<script lang="ts">
	import { theme, type ThemePref } from '$lib/stores/theme.svelte';

	const options: { value: ThemePref; label: string; icon: string }[] = [
		{ value: 'light', label: 'Claro', icon: '☀' },
		{ value: 'dark', label: 'Oscuro', icon: '☾' },
		{ value: 'auto', label: 'Auto', icon: '◐' }
	];

	function setTheme(value: ThemePref) {
		theme.set(value);
	}
</script>

<div
	class="theme-toggle"
	role="group"
	aria-label="Tema de la interfaz"
>
	{#each options as option}
		<button
			type="button"
			class:active={theme.pref === option.value}
			aria-label={`Tema ${option.label}`}
			aria-pressed={theme.pref === option.value}
			onclick={() => setTheme(option.value)}
		>
			<span class="icon">{option.icon}</span>
			<span class="label">{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 3px;
		border: 1px solid var(--color-hairline);
		border-radius: 9999px;
		background: var(--color-card);
		box-shadow: 0 2px 10px var(--color-glow);
	}

	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		height: 32px;
		padding: 0 10px;
		border: 0;
		border-radius: 9999px;
		background: transparent;
		color: var(--color-muted);
		font-family: 'Poppins';
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}

	button:hover {
		color: var(--color-ink);
	}

	button.active {
		background: var(--color-ink);
		color: var(--color-canvas);
	}

	.icon {
		font-size: 15px;
		line-height: 1;
	}

	.label {
		line-height: 1;
	}

	@media (max-width: 480px) {
		button {
			width: 34px;
			padding: 0;
		}

		.label {
			display: none;
		}
	}
</style>
