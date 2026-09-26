<script lang="ts">
	/* Tarjeta estilo Telegram/Xiaomi: radio grande, cabecera pequeña en
	   color de acento dentro de la tarjeta (como "Ayuda", "Cuentas"). */
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
</script>

<section class="hcard">
	{#if title}
		<h2 class="hcard-title">{title}</h2>
	{/if}
	<div class="hcard-body">
		{@render children()}
	</div>
	{#if footer}
		<p class="hcard-footer hx-t2">{footer}</p>
	{/if}
</section>

<style>
	.hcard {
		margin-bottom: 1rem;
	}
	.hcard-title {
		padding: 0 1.25rem 0.5rem;
		font-size: var(--hx-t-section);
		font-weight: 500;
		color: var(--hx-accent);
	}
	.hcard-body {
		background: var(--hx-card);
		border-radius: var(--hx-r-card);
		overflow: hidden;
		box-shadow: var(--hx-tile-shadow);
	}
	.hcard-footer {
		padding: 0.5rem 1.25rem 0;
		font-size: var(--hx-t-sub);
	}
</style>
