<script lang="ts">
	import { page } from '$app/stores';
	const code = $derived($page.params.code ?? '');
	const integrations = [
		['ri-bank-line', 'elToque', 'Conecta pagos y cobros de elToque.'],
		['ri-line-chart-line', 'CambioCUP', 'Consulta tasas de cambio para mostrar equivalentes.'],
		['ri-webhook-line', 'Webhook', 'Recibe eventos de tu tienda en otra aplicación.'],
		['ri-code-s-slash-line', 'API', 'Accede a los datos de tu tienda desde tus herramientas.'],
		['ri-sparkling-2-line', 'MCP', 'Conecta Tiendly con asistentes y herramientas compatibles.']
	];
</script>

<svelte:head><title>Integraciones | Tiendly</title></svelte:head>
<div class="mx-auto max-w-2xl space-y-5 px-4 py-6">
	<section><p class="text-xs font-semibold uppercase tracking-widest text-ember">Experimental</p><h1 class="mt-2 text-2xl font-semibold text-ink">Integraciones</h1><p class="mt-2 text-sm leading-6 text-muted">Estas conexiones estarán disponibles próximamente. No afectan el funcionamiento actual de tu tienda.</p></section>
	<div class="grid gap-3 sm:grid-cols-2">
		{#each integrations as integration}
			<article class="rounded-card border border-hairline bg-card p-5">
				<div class="flex items-start justify-between gap-3"><span class="flex h-10 w-10 items-center justify-center rounded-btn bg-ember/10 text-lg text-ember"><i class={integration[0]}></i></span><span class="rounded-full bg-canvas px-2 py-1 text-[10px] font-semibold text-muted">Próximamente</span></div>
				<h2 class="mt-4 font-semibold text-ink">{integration[1]}</h2><p class="mt-1 text-xs leading-5 text-muted">{integration[2]}</p>
				<button type="button" disabled class="mt-4 w-full rounded-btn border border-hairline px-3 py-2 text-xs font-semibold text-muted">No disponible todavía</button>
			</article>
		{/each}
	</div>
</div>
