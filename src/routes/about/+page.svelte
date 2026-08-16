<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Acerca de Tiendly | Nuestra historia</title>
	<meta name="description" content="Tiendly nació para que cualquier persona pueda tener su catálogo online y recibir pedidos por WhatsApp, sin comisiones ni intermediarios." />
</svelte:head>

<MarketingNav />

<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink mb-3">Acerca de Tiendly</h1>
	<p class="text-muted mb-10">Tu catálogo, tus reglas. Sin comisiones ni intermediarios.</p>

	<div class="prose-spacing space-y-8">
		<section>
			<h2 class="text-xl font-bold text-ink mb-2">Por qué existe Tiendly</h2>
			<p class="text-body leading-relaxed">
				Vender hoy no debería requerir pagar comisiones, depender de una plataforma ajena o entregar a otros tu lista de clientes. Tiendly
				nació con una idea simple: darle a cualquier persona una tienda online propia, con su link, sus precios y sus reglas, donde el
				pedido llega directo a su WhatsApp.
			</p>
		</section>

		<section>
			<h2 class="text-xl font-bold text-ink mb-2">Cómo trabajamos</h2>
			<p class="text-body leading-relaxed">
				Tiendly es software libre de comisiones: no cobramos por venta ni retenemos el dinero de nadie. Tú cobras a tus clientes como
				siempre lo has hecho — efectivo, transferencia, Transfermóvil, EnZona — y nosotros nos encargamos del catálogo, del carrito y
				de que el pedido llegue bien armado a tu WhatsApp.
			</p>
			<p class="text-body leading-relaxed mt-3">
				Eso significa que nuestros intereses están alineados con los tuyos: mientras más vendas, más razones tenemos para mejorar la
				herramienta.
			</p>
		</section>

		<section>
			<h2 class="text-xl font-bold text-ink mb-2">Lo que no hacemos</h2>
			<ul class="space-y-2 text-body">
				<li class="flex items-start gap-2.5">
					<i class="ri-close-line text-ember mt-1"></i>
					<span>No cobramos comisión por ninguna venta.</span>
				</li>
				<li class="flex items-start gap-2.5">
					<i class="ri-close-line text-ember mt-1"></i>
					<span>No retenemos ni procesamos los pagos de tus clientes.</span>
				</li>
				<li class="flex items-start gap-2.5">
					<i class="ri-close-line text-ember mt-1"></i>
					<span>No vendemos tus datos ni los datos de tus clientes.</span>
				</li>
			</ul>
		</section>

		<section>
			<h2 class="text-xl font-bold text-ink mb-2">Contáctanos</h2>
			<ul class="space-y-2 text-body">
				<li class="flex items-center gap-2.5">
					<i class="ri-mail-line text-muted"></i>
					<a href="mailto:hola@tiendly.lat" class="text-ember hover:text-ember-active no-underline">hola@tiendly.lat</a>
				</li>
				<li class="flex items-center gap-2.5">
					<i class="ri-whatsapp-line text-muted"></i>
					<a
						href="https://wa.me/5363807214?text=Hola,%20quiero%20soporte%20de%20Tiendly"
						target="_blank"
						rel="noopener noreferrer"
						class="text-ember hover:text-ember-active no-underline"
					>
						Soporte por WhatsApp
					</a>
				</li>
			</ul>
		</section>
	</div>
</main>

<Footer />