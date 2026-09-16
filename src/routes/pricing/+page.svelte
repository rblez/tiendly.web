<svelte:head>
	<title>Planes | Tiendly</title>
	<meta name="description" content="Elige el plan de Tiendly que mejor se adapta a tu tienda." />
</svelte:head>

<script lang="ts">
	const plans = [
		{ name: 'Mensual', price: '$5', period: 'al mes', detail: 'Flexibilidad para comenzar', featured: false },
		{ name: 'Trimestral', price: '$12', period: 'cada 3 meses', detail: 'Ahorra frente al plan mensual', featured: true },
		{ name: 'Anual', price: '$40', period: 'al año', detail: 'La mejor opción para crecer', featured: false }
	];

	const whatsapp = 'https://wa.me/5363807214?text=Hola%2C%20quiero%20conocer%20los%20planes%20de%20Tiendly';
</script>

<div class="min-h-screen bg-canvas text-ink">
	<header class="border-b border-hairline bg-canvas/95 px-4 py-4 sm:px-6">
		<div class="mx-auto flex max-w-6xl items-center justify-between">
			<a href="/" class="flex items-center gap-3 font-semibold tracking-tight text-ink no-underline"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-white"><i class="ri-store-2-line"></i></span>Tiendly</a>
			<a href="/login" class="text-sm font-semibold text-muted no-underline hover:text-ink">Iniciar sesión</a>
		</div>
	</header>
	<main class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
		<div class="mx-auto max-w-2xl text-center"><p class="text-xs font-bold uppercase tracking-[0.2em] text-ember">Planes claros</p><h1 class="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Crece a tu ritmo</h1><p class="mt-4 text-base leading-7 text-muted">Elige la frecuencia que prefieras. Todos los planes incluyen una tienda y hasta 10 productos.</p></div>
		<div class="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
			{#each plans as plan}
				<article class="relative rounded-card border {plan.featured ? 'border-ember bg-ember/5 shadow-lg' : 'border-hairline bg-card'} p-6">
					{#if plan.featured}<span class="absolute -top-3 left-6 rounded-full bg-ember px-3 py-1 text-[11px] font-bold text-white">Más elegido</span>{/if}
					<p class="text-sm font-semibold text-muted">{plan.name}</p><div class="mt-5 flex items-baseline gap-2"><strong class="text-4xl font-semibold tracking-tight">{plan.price}</strong><span class="text-sm text-muted">{plan.period}</span></div><p class="mt-2 text-sm text-muted">{plan.detail}</p><ul class="mt-6 space-y-3 border-t border-hairline pt-6 text-sm text-body"><li><i class="ri-check-line mr-2 text-ember"></i>1 tienda incluida</li><li><i class="ri-check-line mr-2 text-ember"></i>Hasta 10 productos</li><li><i class="ri-check-line mr-2 text-ember"></i>Soporte por WhatsApp</li></ul><a href={whatsapp} target="_blank" rel="noreferrer" class="btn btn-3d mt-8 w-full no-underline">Escribirme al WhatsApp</a>
				</article>
			{/each}
		</div>
	</main>
</div>
<style>
	:global(body) { margin: 0; }
</style>
