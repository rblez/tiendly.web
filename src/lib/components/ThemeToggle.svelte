<script lang="ts">
	import { theme, type ThemePref } from '$lib/stores/theme.svelte';

	let open = $state(false);

	const options: { value: ThemePref; label: string; icon: string }[] = [
		{ value: 'light', label: 'Claro', icon: 'ri-sun-line' },
		{ value: 'dark', label: 'Oscuro', icon: 'ri-moon-line' },
		{ value: 'auto', label: 'Auto', icon: 'ri-contrast-2-line' },
	];

	const current = $derived(options.find((o) => o.value === theme.pref) ?? options[0]);
	const resolved = $derived(theme.resolved);

	function pick(value: ThemePref) {
		theme.set(value);
		open = false;
	}
</script>

<div class="relative">
	<button
		onclick={() => (open = !open)}
		class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-hairline bg-card text-body hover:text-ink hover:border-ember/50 transition-colors text-xs font-medium cursor-pointer"
		aria-label="Cambiar tema"
		aria-expanded={open}
	>
		<i class="{resolved === 'dark' ? 'ri-moon-line' : 'ri-sun-line'}"></i>
		<span class="hidden sm:inline">{current.label}</span>
		<i class="ri-arrow-down-s-line text-sm opacity-60"></i>
	</button>

	{#if open}
		<div class="absolute bottom-full mb-2 right-0 z-[60] w-40 bg-card border border-hairline rounded-card overflow-hidden shadow-lg shadow-ink/5">
			{#each options as o}
				<button
					onclick={() => pick(o.value)}
					class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer
						{o.value === theme.pref ? 'text-ember font-semibold bg-ember/5' : 'text-body hover:text-ink hover:bg-bone'}"
				>
					<i class="{o.icon}"></i>
					<span class="flex-1 text-left">{o.label}</span>
					{#if o.value === theme.pref}
						<i class="ri-check-line"></i>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
