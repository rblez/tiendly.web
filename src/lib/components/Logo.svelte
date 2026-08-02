<script lang="ts">
	let { size = 'h-8', showText = true }: { size?: string; showText?: boolean } = $props();
</script>

<a href="/" class="flex items-center gap-2.5 text-ink no-underline shrink-0">
	<span class="{size} aspect-square flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-sm select-none">
		T
	</span>
	{#if showText}
		<span class="text-xl font-bold tracking-tight">Tiendly</span>
	{/if}
</a>
