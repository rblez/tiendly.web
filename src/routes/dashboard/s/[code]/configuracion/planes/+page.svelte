<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';

	let code = $derived($page.params.code ?? '');
	let requested = $state(false);
</script>

<svelte:head><title>Planes | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${code}/configuracion`} />

<div class="mx-auto max-w-3xl space-y-5 px-4 py-6">
	<div class="space-y-2">
		<p class="text-xs font-semibold uppercase tracking-widest text-ember">Tiendly Pro</p>
		<h1 class="text-3xl font-semibold tracking-tight text-ink">Elige tu plan</h1>
		<p class="text-sm leading-6 text-muted">Empieza gratis y cambia cuando tu tienda crezca.</p>
	</div>
	<div class="grid gap-4 md:grid-cols-2">
		<section class="rounded-card border border-hairline bg-card p-5">
			<div class="flex items-start justify-between gap-3"><div><h2 class="text-xl font-semibold text-ink">Gratis</h2><p class="mt-1 text-sm text-muted">Para comenzar a vender.</p></div><span class="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-muted">Actual</span></div>
			<p class="mt-5 text-3xl font-bold text-ink">0 <span class="text-sm font-medium text-muted">USD/mes</span></p>
			<p class="mt-2 text-xs text-muted">Valor de funciones: 0.80 USD</p>
			<ul class="mt-5 space-y-3 text-sm text-body"><li>10 productos <span class="text-muted">· valor 0.10 USD</span></li><li>1 tienda <span class="text-muted">· valor 0.10 USD</span></li><li>2 formas de pago <span class="text-muted">· valor 0.20 USD</span></li><li>3 monedas <span class="text-muted">· valor 0.30 USD</span></li><li>Marca Tiendly obligatoria</li><li>1 edición del enlace <span class="text-muted">· valor 0.10 USD</span></li></ul>
			<p class="mt-5 border-t border-hairline pt-4 text-sm font-semibold text-ink">Total incluido: 0.80 USD</p>
		</section>
		<section class="rounded-card border-2 border-ember bg-card p-5 shadow-sm">
			<div><p class="text-xs font-bold uppercase tracking-widest text-ember">Recomendado</p><h2 class="mt-2 text-xl font-semibold text-ink">Estándar</h2><p class="mt-1 text-sm text-muted">Más espacio para crecer.</p></div>
			<p class="mt-5 text-3xl font-bold text-ink">2 <span class="text-sm font-medium text-muted">USD/mes</span></p>
			<p class="mt-2 text-xs text-muted">Valor de funciones: 2.90 USD</p>
			<ul class="mt-5 space-y-3 text-sm text-body"><li>50 productos <span class="text-muted">· valor 0.50 USD</span></li><li>1 tienda <span class="text-muted">· valor 0.10 USD</span></li><li>5 formas de pago <span class="text-muted">· valor 0.50 USD</span></li><li>5 monedas <span class="text-muted">· valor 0.50 USD</span></li><li>Sin marca Tiendly <span class="text-muted">· valor 1 USD</span></li><li>3 ediciones del enlace <span class="text-muted">· valor 0.30 USD</span></li></ul>
			<p class="mt-5 border-t border-hairline pt-4 text-sm font-semibold text-ink">Total: 2.90 USD · Precio: 2 USD/mes</p>
			<button type="button" onclick={() => (requested = true)} class="btn btn-3d btn-md mt-6 w-full">Pasar a Estándar</button>
		</section>
	</div>
	{#if requested}<p class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-sm text-ember">Solicitud recibida. El pago de Pro se habilitará desde tu panel.</p>{/if}
</div>
