<script lang="ts">
	/* Sección agrupada estilo Ajustes de iOS: cabecera footnote + tarjeta
	   secondarySystemGroupedBackground con radio 10pt + nota al pie. */
	import type { Snippet } from "svelte";

	let {
		title,
		footer,
		children,
	}: {
		title?: string;
		footer?: string;
		children: Snippet;
	} = $props();

	const labelledBy = $derived(title ? `tgroup-${title.replace(/\s+/g, "-").toLowerCase()}` : undefined);
</script>

<section class="tgroup" aria-labelledby={labelledBy}>
	{#if title}
		<h2 id={labelledBy} class="tgroup-title t-footnote t-secondary">{title}</h2>
	{/if}
	<div class="tgroup-card" role={title ? undefined : "group"}>
		{@render children()}
	</div>
	{#if footer}
		<p class="tgroup-footer t-footnote t-secondary">{footer}</p>
	{/if}
</section>

<style>
	.tgroup {
		margin-bottom: var(--s5);
	}
	.tgroup-title {
		padding: 0 var(--s4) var(--s2);
		font-weight: 400;
	}
	.tgroup-card {
		background: var(--ios-grouped-2);
		border-radius: var(--r-md);
		overflow: hidden;
		box-shadow: var(--shadow-card);
	}
	.tgroup-footer {
		padding: var(--s2) var(--s4) 0;
	}
</style>
