<script lang="ts">
	let { size = 'h-8', showText = true, src = '/logo.png' }: { size?: string; showText?: boolean; src?: string } = $props();
</script>

<a href="/" class="flex items-center gap-2.5 text-ink no-underline shrink-0">
	{#if showText}
		<img src={src} alt="Tiendly" class="{size} w-auto select-none" />
	{:else}
		<img src={src} alt="Tiendly" class="{size} aspect-square rounded-lg select-none" />
	{/if}
</a>
