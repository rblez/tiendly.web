<script lang="ts">
	/* Página iOS: Large Title de 34pt + márgenes de 16pt + ancho contenido. */
	import type { Snippet } from "svelte";

	let {
		title,
		subtitle,
		actions,
		children,
	}: {
		title: string;
		subtitle?: string;
		actions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="tpage">
	<header class="tpage-head">
		<div class="tpage-titles">
			<h1 class="t-large-title">{title}</h1>
			{#if subtitle}
				<p class="t-subhead t-secondary">{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="tpage-actions">{@render actions()}</div>
		{/if}
	</header>
	<div class="tpage-body">{@render children()}</div>
</div>

<style>
	.tpage {
		margin: 0 auto;
		width: 100%;
		max-width: 44rem;
		padding: var(--s4) var(--s4) var(--s8);
	}
	.tpage-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--s3);
		padding: var(--s2) var(--s1) var(--s3);
	}
	.tpage-titles {
		min-width: 0;
	}
	.tpage-titles .t-subhead {
		margin-top: var(--s1);
	}
	.tpage-actions {
		display: flex;
		align-items: center;
		gap: var(--s2);
		padding-bottom: var(--s1);
	}
</style>
