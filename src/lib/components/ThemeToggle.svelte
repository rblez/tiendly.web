<script lang="ts">
	import { theme, type ThemePref } from "$lib/stores/theme.svelte";

	let { variant = "compact" }: { variant?: "compact" | "cards" } = $props();

	const options: { value: ThemePref; label: string; icon: string }[] = [
		{ value: "light", label: "Claro", icon: "ri-sun-line" },
		{ value: "dark", label: "Oscuro", icon: "ri-moon-line" },
		{ value: "auto", label: "Automático", icon: "ri-contrast-2-line" },
	];
</script>

{#if variant === "cards"}
	<div class="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Tema de la interfaz">
		{#each options as option (option.value)}
			{@const active = theme.pref === option.value}
			<button
				type="button"
				role="radio"
				aria-checked={active}
				onclick={() => theme.set(option.value)}
				class="flex flex-col items-center gap-2 rounded-card border px-3 py-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember {active
					? 'border-ember bg-ember/10 text-ink'
					: 'border-hairline bg-card text-muted hover:text-ink'}"
			>
				<i class="{option.icon} text-2xl {active ? 'text-ember' : ''}" aria-hidden="true"></i>
				{option.label}
			</button>
		{/each}
	</div>
{:else}
	<div class="theme-compact" role="group" aria-label="Tema de la interfaz">
		{#each options as option (option.value)}
			<button
				type="button"
				class:active={theme.pref === option.value}
				aria-label={`Tema ${option.label}`}
				aria-pressed={theme.pref === option.value}
				title={option.label}
				onclick={() => theme.set(option.value)}
			>
				<i class={option.icon} aria-hidden="true"></i>
			</button>
		{/each}
	</div>
{/if}

<style>
	.theme-compact {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 2px;
		border: 1px solid var(--color-hairline);
		border-radius: 8px;
	}

	.theme-compact button {
		display: flex;
		width: 28px;
		height: 26px;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--color-muted);
		font-size: 15px;
		cursor: pointer;
		transition:
			background-color 160ms ease,
			color 160ms ease;
	}

	.theme-compact button:hover {
		color: var(--color-ink);
	}

	.theme-compact button.active {
		background: var(--color-ink);
		color: var(--color-canvas);
	}

	.theme-compact button:focus-visible {
		outline: 2px solid var(--color-ember);
		outline-offset: 1px;
	}

	.theme-compact i {
		display: block;
		line-height: 1;
	}
</style>
