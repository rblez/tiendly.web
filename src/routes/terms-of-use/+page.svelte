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
	<p class="text-muted mb-4">Última actualización: 12 de septiembre de 2026</p>
	<div class="mb-10 rounded-btn border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-body"><strong class="text-ink">Aviso importante:</strong> este documento es un borrador informativo y requiere revisión humana y legal antes de publicarse como texto vinculante.</div>

	<div class="space-y-8 text-body leading-relaxed">
		<section>
			<h2 class="text-lg font-bold text-ink mb-2">1. El servicio</h2>
			<p>
				Tiendly es una plataforma para crear una tienda online (una por usuario), publicar un catálogo y gestionar pedidos. Puede enviar pedidos a WhatsApp si el vendedor lo configura o usar métodos manuales de pago contra entrega. Tiendly no es un procesador de pagos: no interviene, garantiza ni responde por las transacciones entre vendedor y comprador, que se realizan fuera de Tiendly mediante los métodos configurados por el vendedor.
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
			<h2 class="text-lg font-bold text-ink mb-2">5. Fase beta y disponibilidad</h2>
			<p>
				Tiendly está en fase beta. Las funciones, límites, interfaces y condiciones pueden cambiar, y el servicio puede sufrir interrupciones, errores o pérdida de disponibilidad mientras se desarrolla.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">6. Disponibilidad del servicio</h2>
			<p>
				El servicio se ofrece "tal cual", con el mejor esfuerzo posible. Podemos suspender, modificar o interrumpir funciones por
				mantenimiento, seguridad o cambios de producto, con o sin aviso previo. En caso de abuso, podemos suspender o eliminar cuentas y
				tiendas.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">7. Limitación de responsabilidad</h2>
			<p>
				Hasta el máximo permitido por la ley, Tiendly no será responsable por daños derivados del uso de la plataforma, incluidos
				pedidos fallidos, pérdidas de datos o ventas de otros usuarios. La relación comercial entre vendedores y compradores es ajena a
				Tiendly.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">8. Cuenta y cierre</h2>
			<p>
				Puedes solicitar el cierre de tu cuenta y la eliminación de tus datos. Tiendly puede suspender o eliminar cuentas y tiendas por fraude, abuso, contenido ilegal, incumplimiento de estos términos o riesgo para otros usuarios y la plataforma.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">9. Cambios a estos términos</h2>
			<p>
				Podemos actualizar estos términos; los cambios se publicarán en esta página con su fecha. El uso continuado del servicio tras los
				cambios implica su aceptación.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-bold text-ink mb-2">10. Contacto</h2>
			<p>
				Dudas sobre estos términos: <a href="mailto:hola@tiendly.lat" class="text-ember hover:text-ember-active no-underline">hola@tiendly.lat</a>.
			</p>
		</section>
	</div>
</main>

<Footer />
