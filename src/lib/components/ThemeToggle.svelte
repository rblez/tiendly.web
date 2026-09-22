<script lang="ts">
	import { theme, type ThemePref } from '$lib/stores/theme.svelte';

	const options: {
		value: ThemePref;
		label: string;
		icon: string;
	}[] = [
		{
			value: 'light',
			label: 'Claro',
			icon: 'ri-sun-line'
		},
		{
			value: 'dark',
			label: 'Oscuro',
			icon: 'ri-moon-line'
		},
		{
			value: 'auto',
			label: 'Automático',
			icon: 'ri-contrast-2-line'
		}
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
			title={option.label}
			onclick={() => setTheme(option.value)}
		>
			<i class={option.icon} aria-hidden="true"></i>
		</button>
	{/each}
</div>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 4px;
		border: 1px solid var(--color-hairline);
		border-radius: 999px;
		background: color-mix(
			in srgb,
			var(--color-card) 94%,
			transparent
		);
		box-shadow:
			0 2px 8px color-mix(
				in srgb,
				var(--color-ink) 8%,
				transparent
			),
			inset 0 1px 0 color-mix(
				in srgb,
				var(--color-ink) 4%,
				transparent
			);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	button {
		display: flex;
		width: 38px;
		height: 32px;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--color-muted);
		font-size: 17px;
		cursor: pointer;
		transition:
			background-color 160ms ease,
			color 160ms ease,
			transform 160ms ease;
	}

	button:hover {
		color: var(--color-ink);
	}

	button:active {
		transform: scale(0.94);
	}

	button.active {
		background: var(--color-ink);
		color: var(--color-canvas);
		box-shadow:
			0 1px 3px color-mix(
				in srgb,
				var(--color-ink) 15%,
				transparent
			);
	}

	button:focus-visible {
		outline: 2px solid var(--color-ember);
		outline-offset: 2px;
	}

	i {
		display: block;
		line-height: 1;
	}

	@media (max-width: 480px) {
		.theme-toggle {
			gap: 2px;
			padding: 3px;
		}

		button {
			width: 34px;
			height: 30px;
			font-size: 16px;
		}
	}
</style>