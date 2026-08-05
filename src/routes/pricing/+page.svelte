<script lang="ts">
	import { PLANS } from '$lib/plans';
	import Logo from '$lib/components/Logo.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Planes y precios | Tiendly</title>
	<meta name="description" content="Crea tu tienda gratis. Planes Free, Creator y Business con más tiendas y productos. Precios en USD, pago en cripto (USDT)." />
</svelte:head>

<header class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
	<a href="/" class="no-underline"><Logo /></a>
	<a href="/wizard" class="inline-flex items-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline">
		<i class="ri-add-line"></i>
		Crear mi tienda
	</a>
</header>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
	<div class="text-center mb-12">
		<h1 class="text-3xl sm:text-4xl font-extrabold text-ink mb-3">Planes para cada etapa</h1>
		<p class="text-body max-w-xl mx-auto">
			Empieza gratis y crece cuando quieras. Precios en USD, se pagan en cripto (USDT).
		</p>
	</div>

	<div class="grid gap-5 md:grid-cols-3 max-w-4xl mx-auto">
		{#each PLANS as p}
			<div class={`bg-card border rounded-card p-6 flex flex-col ${p.id === 'business' ? 'border-ember border-2' : 'border-hairline'}`}>
				<div class="flex items-center justify-between mb-2">
					<h2 class="text-lg font-bold text-ink">{p.name}</h2>
					{#if p.id === 'business'}
						<span class="text-[10px] font-bold bg-ember text-white rounded-full px-2 py-0.5">Más popular</span>
					{/if}
				</div>
				<p class="text-xs text-muted mb-4">{p.tagline}</p>
				<p class="text-3xl font-black text-ink mb-1">{p.priceLabel}</p>
				<ul class="space-y-2 my-5 flex-1">
					{#each p.features as feat}
						<li class="text-sm text-body flex items-start gap-2">
							<i class="ri-check-line text-ember mt-0.5 flex-shrink-0"></i>
							{feat}
						</li>
					{/each}
				</ul>
				<a
					href="/wizard"
					class={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 no-underline ${
						p.id === 'free' ? 'bg-bone border border-hairline text-ink hover:border-ember/50' : 'bg-ember text-white hover:bg-ember-active'
					}`}
				>
					{p.id === 'free' ? 'Empezar gratis' : `Elegir ${p.name}`}
				</a>
				{#if p.id !== 'free'}
					<p class="text-[10px] text-muted-soft text-center mt-2">Próximamente · pago en USDT</p>
				{/if}
			</div>
		{/each}
	</div>

	<p class="text-center text-xs text-muted-soft mt-10 max-w-md mx-auto">
		Sin tarjetas ni contratos. Cuando elijas un plan de pago recibirás una dirección de USDT (TRC-20) para el pago mensual.
	</p>
</section>

<Footer />
