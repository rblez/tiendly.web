<script lang="ts">
	import { brandPath } from '$lib/brands';

	let {
		name,
		color = 'currentColor',
		class: cls = 'h-4 w-4'
	}: { name: string; color?: string; class?: string } = $props();

	const d = $derived(brandPath(name));
</script>

{#if d}
	<svg viewBox="0 0 24 24" class={cls} fill={color} aria-hidden="true">
		<path d={d}></path>
	</svg>
{/if}
