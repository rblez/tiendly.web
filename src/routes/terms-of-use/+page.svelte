<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Términos de uso | Tiendly</title>
	<meta name="description" content="Términos y condiciones de uso del servicio Tiendly: cuentas, tiendas, responsabilidades y reglas del servicio." />
</svelte:head>

<MarketingNav />

<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink mb-3">Términos de uso</h1>
	<p class="text-muted mb-10">Última actualización: 16 de agosto de 2026</p>

	<div class="space-y-8 text-body leading-relaxed">
		<section>
			<h2 class="text-lg font-bold text-ink mb-2">1. El servicio</h2>
			<p>
				Tiendly es una plataforma que permite a cualquier persona crear un catálogo público ("tienda") y recibir pedidos de sus clientes,
				típicamente por WhatsApp u otros canales que el propio dueño configure. El pago de los pedidos se acuerda directamente entre el
				vendedor y el comprador; Tiendly no procesa pagos ni actúa como intermediario financiero.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">2. Cuentas y tiendas</h2>
			<p>
				Para usar Tiendly debes tener una cuenta y ser responsable de mantenerla segura. El plan Gratis incluye 1 tienda y hasta 10
				productos. Solo tienes permitido publicar contenido que tengas derecho a publicar: productos lícitos, fotos propias o autorizadas,
				precios y descripciones veraces.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">3. Conducta prohibida</h2>
			<p>No puedes usar Tiendly para:</p>
			<ul class="list-disc pl-5 mt-2 space-y-1.5">
				<li>vender productos o servicios ilegales o que infrinjan derechos de terceros;</li>
				<li>suplantar identidades, hacer phishing o recolectar datos de clientes de otras tiendas;</li>
				<li>publicar contenido ofensivo, discriminatorio o que viole la ley vigente;</li>
				<li>intentar vulnerar, sobrecargar o explotar la plataforma o sus datos.</li>
			</ul>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">4. Pedidos y transacciones</h2>
			<p>
				Tiendly entrega al vendedor los datos que el comprador proporcione en el checkout y el detalle del pedido. La venta, el cobro y la
				entrega son responsabilidad exclusiva del vendedor. Tiendly no garantiza la calidad, disponibilidad ni legalidad de los productos
				publicados por sus usuarios.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">5. Disponibilidad del servicio</h2>
			<p>
				El servicio se ofrece "tal cual", con el mejor esfuerzo posible. Podemos suspender, modificar o interrumpir funciones por
				mantenimiento, seguridad o cambios de producto, con o sin aviso previo. En caso de abuso, podemos suspender o eliminar cuentas y
				tiendas.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">6. Limitación de responsabilidad</h2>
			<p>
				Hasta el máximo permitido por la ley, Tiendly no será responsable por daños derivados del uso de la plataforma, incluidos
				pedidos fallidos, pérdidas de datos o ventas de otros usuarios. La relación comercial entre vendedores y compradores es ajena a
				Tiendly.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">7. Cambios a estos términos</h2>
			<p>
				Podemos actualizar estos términos; los cambios se publicarán en esta página con su fecha. El uso continuado del servicio tras los
				cambios implica su aceptación.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">8. Contacto</h2>
			<p>
				Dudas sobre estos términos: <a href="mailto:hola@tiendly.lat" class="text-ember hover:text-ember-active no-underline">hola@tiendly.lat</a>.
			</p>
		</section>
	</div>
</main>

<Footer />