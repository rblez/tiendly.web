<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { SITE_URL } from '$lib/utils';
</script>

<Seo
	title="Privacidad | Tiendly"
	description="Información sobre los datos que Tiendly utiliza para operar tiendas, catálogos y pedidos."
	canonical={SITE_URL + '/legal/privacidad'}
	image={SITE_URL + '/og-banner.webp'}
	imageAlt="Política de privacidad de Tiendly"
	imageSize={{ w: 1536, h: 1024 }}
/>

<MarketingNav />
<main class="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
	<h1 class="mb-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">Política de privacidad</h1>
	<p class="mb-8 text-muted">Versión informativa. Última actualización: septiembre de 2026.</p>
	<div class="mb-10 rounded-btn border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-body"><strong class="text-ink">Aviso:</strong> este documento es un borrador y requiere revisión humana y legal antes de publicarse como texto vinculante.</div>
	<div class="space-y-8 text-body leading-relaxed">
		<section><h2 class="mb-2 text-lg font-bold text-ink">Datos que usamos</h2><p>Podemos procesar datos de cuenta, configuración de tienda, catálogo y la información que compradores proporcionen en un pedido. Los datos se usan para autenticar, operar la plataforma, mostrar tiendas y entregar pedidos al vendedor correspondiente.</p></section>
		<section><h2 class="mb-2 text-lg font-bold text-ink">Almacenamiento y proveedores</h2><p>Tiendly utiliza servicios de infraestructura y base de datos para prestar el servicio. No vendemos datos personales ni enviamos credenciales, tokens o contraseñas a terceros.</p></section>
		<section><h2 class="mb-2 text-lg font-bold text-ink">Tus opciones</h2><p>Puedes solicitar corrección o eliminación de los datos de tu cuenta y tienda desde los canales de soporte disponibles.</p></section>
		<section><h2 class="mb-2 text-lg font-bold text-ink">Datos legales pendientes</h2><p>El responsable legal, domicilio, jurisdicción y canal formal de privacidad serán completados en la versión definitiva tras revisión legal.</p></section>
	</div>
</main>
<Footer />
<style>:global(body) { margin: 0; }</style>
