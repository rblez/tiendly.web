<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		padded = true,
		children,
		actions,
	}: {
		title?: string;
		description?: string;
		padded?: boolean;
		children: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<section class="card overflow-hidden">
	{#if title || actions}
		<div class="flex items-start justify-between gap-3 border-b border-hairline px-4 py-3.5 sm:px-5">
			<div class="min-w-0">
				{#if title}
					<h2 class="text-sm font-semibold text-ink font-display">{title}</h2>
				{/if}
				{#if description}
					<p class="mt-0.5 text-xs text-muted">{description}</p>
				{/if}
			</div>
			{#if actions}
				<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
			{/if}
		</div>
	{/if}
	<div class={padded ? 'p-4 sm:p-5' : ''}>
		{@render children()}
	</div>
</section>
