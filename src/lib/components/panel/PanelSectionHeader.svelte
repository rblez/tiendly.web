<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		actions,
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
	<div class="min-w-0">
		<h1 class="text-xl font-semibold text-ink font-display sm:text-2xl">{title}</h1>
		{#if description}
			<p class="mt-1 text-sm text-muted">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</div>
