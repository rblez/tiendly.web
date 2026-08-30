<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Política de privacidad | Tiendly</title>
	<meta name="description" content="Cómo Tiendly maneja tus datos y los de tus clientes: qué recogemos, para qué y tus derechos." />
</svelte:head>

<MarketingNav />

<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink mb-3">Política de privacidad</h1>
	<p class="text-muted mb-10">Última actualización: 16 de agosto de 2026</p>

	<div class="space-y-8 text-body leading-relaxed">
		<section>
			<h2 class="text-lg font-bold text-ink mb-2">Resumen</h2>
			<p>
				Recolectamos lo mínimo necesario para que Tiendly funcione: datos de tu cuenta, de tu tienda y de los pedidos que se generan.
				No vendemos tus datos ni los usamos para anunciarte. Puedes pedir la eliminación de tu cuenta y de tu tienda en cualquier momento.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">1. Qué datos recogemos</h2>
			<ul class="list-disc pl-5 mt-2 space-y-1.5">
				<li><strong>De la cuenta:</strong> correo electrónico y datos de autenticación (gestionados por Supabase Auth).</li>
				<li><strong>De la tienda:</strong> nombre, descripción, logo, productos, precios, catálogo y configuración que tú agregas.</li>
				<li><strong>De los pedidos:</strong> los datos que los clientes dejan al pedir (nombre, teléfono, datos pedidos por la tienda,
				comprobantes de pago en subida) y el historial de cada pedido.</li>
				<li><strong>De uso:</strong> número de visitas agregado por tienda y por día (sin identificar al visitante) y estadísticas
				agregadas de páginas.</li>
			</ul>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">2. Por qué los usamos</h2>
			<ul class="list-disc pl-5 mt-2 space-y-1.5">
				<li>Para operar la plataforma: autenticación, administración de tiendas y entrega de pedidos al vendedor.</li>
				<li>Para mostrar a los dueños sus estadísticas de visitas y pedidos.</li>
				<li>Para mejorar el servicio mediante métricas agregadas.</li>
				<li>Para responder a solicitudes de soporte.</li>
			</ul>
			<p class="mt-3">
				Los datos de un pedido se comparten únicamente con el dueño de la tienda correspondiente, que es quien lo recibe para
				coordinar la venta.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">3. Base legal y retención</h2>
			<p>
				Usamos tus datos sobre la base de tu consentimiento y del cumplimiento del contrato de servicio. Conservamos los datos mientras
				tu cuenta esté activa y para cumplir obligaciones legales. Los datos de visitas se guardan agregados por día y tienda.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">4. Comprobantes de pago</h2>
			<p>
				Cuando una tienda pide comprobante de pago, el archivo se guarda de forma privada en un almacenamiento protegido y solo es
				visible para el dueño de la tienda. Se elimina cuando se elimina el pedido o la tienda.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">5. Cookies y análisis</h2>
			<p>
				Usamos almacenamiento local del navegador para preferencias (tema, consentimiento, carrito) y señales de análisis de visitas
				anónimas. No usamos anuncios de terceros ni rastreadores publicitarios.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">6. Tus derechos</h2>
			<ul class="list-disc pl-5 mt-2 space-y-1.5">
				<li>Acceder y corregir los datos de tu tienda desde el panel.</li>
				<li>Eliminar tu tienda y sus productos desde el panel.</li>
				<li>Solicitar la eliminación de tu cuenta escribiéndonos.</li>
			</ul>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">7. Contacto</h2>
			<p>
				Consultas de privacidad: <a href="mailto:hola@tiendly.lat" class="text-ember hover:text-ember-active no-underline">hola@tiendly.lat</a>.
			</p>
		</section>
	</div>
</main>

<Footer />
