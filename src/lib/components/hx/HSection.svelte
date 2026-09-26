<script lang="ts">
	/* Sección de subpágina Xiaomi: etiqueta gris pequeña sobre la tarjeta,
	   filas sin tiles ni divisores. */
	import type { Snippet } from "svelte";

	let {
		label,
		footer,
		children,
	}: {
		label: string;
		footer?: string;
		children: Snippet;
	} = $props();
</script>

<section class="hsection">
	<h2 class="hsection-label">{label}</h2>
	<div class="hsection-card">
		{@render children()}
	</div>
	{#if footer}
		<p class="hsection-footer hx-t2">{footer}</p>
	{/if}
</section>

<style>
	.hsection {
		margin-bottom: 1.5rem;
	}
	.hsection-label {
		padding: 0 0.25rem 0.5rem;
		font-size: var(--hx-t-sub);
		font-weight: 400;
		color: var(--hx-text-2);
	}
	.hsection-card {
		background: var(--hx-card);
		border-radius: 1.25rem;
		overflow: hidden;
		box-shadow: var(--hx-tile-shadow);
	}
	/* En subpáginas las filas van limpias: sin divisores */
	.hsection-card :global(.hrow-divider) {
		display: none;
	}
	.hsection-card :global(.hrow) {
		padding: 0.875rem 1.25rem;
	}
	.hsection-footer {
		padding: 0.5rem 0.25rem 0;
		font-size: var(--hx-t-sub);
	}
</style>
