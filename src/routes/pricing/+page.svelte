<script lang="ts">
	import { PLANS, planQuarterPrice, QUARTER_DISCOUNT, planWhatsAppUrl } from '$lib/plans';
	import Footer from '$lib/components/Footer.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let billing: 'monthly' | 'quarterly' = $state('monthly');

	function priceFor(p: (typeof PLANS)[number]): string {
		if (p.customPrice) return 'Precio personalizado';
		if (p.price === 0) return '∞';
		if (billing === 'quarterly') return `$${planQuarterPrice(p.price)} USD`;
		return p.priceLabel;
	}
</script>

<svelte:head>
	<title>Planes y precios | Tiendly</title>
	<meta name="description" content="Crea tu tienda gratis. Planes Gratis, Estándar y Negocios con más tiendas y productos. Precios en USD." />
</svelte:head>

<header class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-end">
	<a href="/wizard" class="inline-flex items-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline">
		<i class="ri-add-line"></i>
		Crear mi tienda
	</a>
</header>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
	<div class="text-center mb-8">
		<h1 class="text-3xl sm:text-4xl font-extrabold text-ink mb-3">Planes para cada etapa</h1>
		<p class="text-body max-w-xl mx-auto">
			Empieza gratis y crece cuando quieras. Precios en USD.
		</p>
	</div>

	<div class="flex items-center justify-center gap-3 mb-10">
		<span class={`text-sm font-medium ${billing === 'monthly' ? 'text-ink' : 'text-muted-soft'}`}>1 mes</span>
		<button
			onclick={() => (billing = billing === 'monthly' ? 'quarterly' : 'monthly')}
			class={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${billing === 'quarterly' ? 'bg-ember' : 'bg-bone border border-hairline'}`}
			role="switch"
			aria-checked={billing === 'quarterly'}
			aria-label="Alternar facturación"
		>
			<span class={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${billing === 'quarterly' ? 'left-[22px]' : 'left-0.5'}`}></span>
		</button>
		<span class={`text-sm font-medium ${billing === 'quarterly' ? 'text-ink' : 'text-muted-soft'}`}>
			3 meses
			<span class="ml-1.5 text-[10px] font-bold bg-ember/10 text-ember rounded-full px-2 py-0.5">-{Math.round(QUARTER_DISCOUNT * 100)}%</span>
		</span>
	</div>

	<div class="grid gap-5 md:grid-cols-3 max-w-4xl mx-auto">
		{#each PLANS as p}
			<div class={`bg-card border rounded-card p-6 flex flex-col ${p.id === 'creator' ? 'border-ember border-2' : 'border-hairline'}`}>
				<div class="flex items-center justify-between mb-2">
					<h2 class="text-lg font-bold text-ink">{p.name}</h2>
					{#if p.id === 'creator'}
						<span class="text-[10px] font-bold bg-ember text-white rounded-full px-2 py-0.5">Recomendado</span>
					{/if}
				</div>
				<p class="text-xs text-muted mb-4">{p.tagline}</p>
				<p class="text-3xl font-black text-ink mb-1">{priceFor(p)}</p>
				{#if !p.customPrice && billing === 'quarterly'}
					<p class="text-[11px] text-muted-soft line-through">${p.price} USD/mes</p>
				{/if}
				<ul class="space-y-2 my-5 flex-1">
					{#each p.features as feat}
						<li class="text-sm text-body flex items-start gap-2">
							<i class="ri-check-line text-ember mt-0.5 flex-shrink-0"></i>
							{feat}
						</li>
					{/each}
				</ul>
				<a
					href={p.id === 'free' ? p.ctaHref : planWhatsAppUrl(p.name, billing, auth.session?.user?.email ?? '—')}
					class={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 no-underline ${
						p.id === 'free' ? 'bg-bone border border-hairline text-ink hover:border-ember/50' : 'bg-ember text-white hover:bg-ember-active'
					}`}
				>
					{#if p.id !== 'free'}
						<i class="ri-whatsapp-line"></i>
					{/if}
					{p.ctaLabel}
				</a>
			</div>
		{/each}
	</div>

	<p class="text-center text-xs text-muted-soft mt-10 max-w-md mx-auto">
		Sin tarjetas ni contratos. Al elegir un plan de pago recibirás los detalles para pagar por tu medio preferido, {billing === 'quarterly' ? 'trimestral, con 13% de descuento' : 'mensual'}.
	</p>
</section>

<Footer />