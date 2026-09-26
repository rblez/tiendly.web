<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { SITE_URL } from '$lib/utils';
</script>

<Seo
	title="Precios | Tiendly"
	description="Tiendly está en beta: crea tu tienda online y empieza a organizar tus productos y pedidos."
	canonical={SITE_URL + '/precios'}
	image={SITE_URL + '/og-banner.webp'}
	imageAlt="Precios de Tiendly"
	imageSize={{ w: 1536, h: 1024 }}
/>

<MarketingNav />
<main class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
	<div class="mx-auto max-w-2xl text-center">
		<p class="text-xs font-bold uppercase tracking-[0.2em] text-ember">Precios transparentes</p>
		<h1 class="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">Tiendly está en beta</h1>
		<p class="mt-4 text-base leading-7 text-muted">Puedes crear tu tienda y probar el flujo de catálogo y pedidos. Actualmente no hay planes de pago activos ni precios publicados.</p>
	</div>
	<div class="mx-auto mt-12 max-w-lg rounded-card border border-ember/40 bg-card p-8 text-center shadow-sm">
		<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ember/10 text-ember"><i class="ri-store-2-line text-2xl" aria-hidden="true"></i></div>
		<h2 class="mt-5 text-2xl font-bold text-ink">Plan beta</h2>
		<p class="mt-3 text-body">Crea una tienda, agrega productos y comparte tu catálogo. Las condiciones comerciales futuras se comunicarán antes de activar cualquier cobro.</p>
		<ul class="mt-6 space-y-3 text-left text-sm text-body"><li><i class="ri-check-line mr-2 text-ember" aria-hidden="true"></i>Sin precio publicado actualmente</li><li><i class="ri-check-line mr-2 text-ember" aria-hidden="true"></i>Sin comisiones por venta anunciadas</li><li><i class="ri-check-line mr-2 text-ember" aria-hidden="true"></i>Pedidos directos desde tu tienda</li></ul>
		<a href="/wizard" class="btn btn-3d mt-8 w-full no-underline">Crear mi tienda</a>
	</div>
</main>
<Footer />
<style>:global(body) { margin: 0; }</style>
