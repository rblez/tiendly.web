<script lang="ts">
	/* Subpágina estilo Xiaomi: flecha atrás + título grande, fondo negro,
	   sin barra de app ni navegación inferior. */
	import type { Snippet } from "svelte";
	import HIcon from "./HIcon.svelte";

	let {
		title,
		backHref,
		backLabel = "Atrás",
		children,
	}: {
		title: string;
		backHref: string;
		backLabel?: string;
		children: Snippet;
	} = $props();
</script>

<div class="hsubpage" data-hyper>
	<div class="hsubpage-top" style:padding-top="env(safe-area-inset-top)">
		<a href={backHref} class="hsubpage-back hx-press" aria-label={backLabel}>
			<HIcon name="arrowLeft" size={28} strokeWidth={2} />
		</a>
		<h1 class="hsubpage-title">{title}</h1>
	</div>
	<main class="hsubpage-main">
		{@render children()}
	</main>
</div>

<style>
	.hsubpage {
		min-height: 100vh;
		min-height: 100dvh;
	}
	.hsubpage-top {
		padding: 0.5rem 1rem 0;
		max-width: 44rem;
		margin-inline: auto;
	}
	.hsubpage-back {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		margin-left: -0.75rem;
		border-radius: 50%;
		color: var(--hx-text);
		text-decoration: none;
	}
	.hsubpage-title {
		margin: 0.25rem 0 1.25rem;
		font-size: 2.25rem;
		line-height: 1.15;
		font-weight: 700;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}
	.hsubpage-main {
		max-width: 44rem;
		margin-inline: auto;
		padding: 0 1rem calc(2rem + env(safe-area-inset-bottom));
	}
</style>
