<script lang="ts">
	let { backHref, title = 'Configuración' }: { backHref: string; title?: string } = $props();
</script>

<header class="settings-header">
	<a href={backHref} aria-label="Volver" class="back-link">
		<span aria-hidden="true">←</span>
	</a>
	<h1>{title}</h1>
</header>

<style>
	.settings-header {
		display: grid;
		grid-template-columns: 2.75rem 1fr 2.75rem;
		align-items: center;
		min-height: 4.5rem;
		padding: 0 1rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.settings-header h1 {
		grid-column: 2;
		margin: 0;
		color: hsl(var(--foreground));
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1.4;
		text-align: center;
	}

	.back-link {
		display: inline-flex;
		grid-column: 1;
		align-items: center;
		justify-content: flex-start;
		width: 2.75rem;
		height: 2.75rem;
		color: hsl(var(--foreground));
		font-size: 1.75rem;
		line-height: 1;
		text-decoration: none;
		transition: opacity 150ms ease;
	}

	.back-link:hover {
		opacity: 0.7;
	}

	.back-link:focus-visible {
		border-radius: 0.25rem;
		outline: 2px solid hsl(var(--ring));
		outline-offset: 3px;
	}
</style>
