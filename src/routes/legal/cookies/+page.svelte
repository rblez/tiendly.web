<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { SITE_URL } from '$lib/utils';
</script>

<Seo
	title="Cookies y almacenamiento local | Tiendly"
	description="Cómo Tiendly utiliza cookies y almacenamiento local para preferencias y funcionamiento básico."
	canonical={SITE_URL + '/legal/cookies'}
	image={SITE_URL + '/og-banner.webp'}
	imageAlt="Cookies y almacenamiento local en Tiendly"
	imageSize={{ w: 1536, h: 1024 }}
/>

<MarketingNav />
<main class="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
	<h1 class="mb-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">Cookies y almacenamiento local</h1>
	<p class="mb-8 text-muted">Versión informativa. Última actualización: septiembre de 2026.</p>
	<div class="space-y-8 text-body leading-relaxed">
		<section><h2 class="mb-2 text-lg font-bold text-ink">Uso esencial</h2><p>Tiendly puede utilizar cookies o almacenamiento local para mantener preferencias como el tema, recordar el carrito y sostener funciones básicas de la tienda.</p></section>
		<section><h2 class="mb-2 text-lg font-bold text-ink">Medición</h2><p>Podemos registrar métricas agregadas de navegación para entender el uso de las tiendas. No utilizamos estas tecnologías para vender perfiles publicitarios.</p></section>
		<section><h2 class="mb-2 text-lg font-bold text-ink">Control</h2><p>Puedes borrar o bloquear el almacenamiento desde la configuración de tu navegador. Algunas funciones podrían dejar de funcionar correctamente.</p></section>
		<section><h2 class="mb-2 text-lg font-bold text-ink">Datos legales pendientes</h2><p>La lista definitiva de proveedores, periodos de conservación y responsable legal será completada tras revisión legal.</p></section>
	</div>
</main>
<Footer />
<style>:global(body) { margin: 0; }</style>
