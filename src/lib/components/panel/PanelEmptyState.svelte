<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon = 'ri-inbox-line',
		title,
		description,
		actions,
	}: {
		icon?: string;
		title: string;
		description?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="empty-state flex flex-col items-center">
	<span class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-ember">
		<i class={icon} style="font-size: 22px" aria-hidden="true"></i>
	</span>
	<h3 class="text-sm font-semibold text-ink font-display">{title}</h3>
	{#if description}
		<p class="mt-1 max-w-sm text-sm text-muted">{description}</p>
	{/if}
	{#if actions}
		<div class="mt-4 flex items-center gap-2">{@render actions()}</div>
	{/if}
</div>
