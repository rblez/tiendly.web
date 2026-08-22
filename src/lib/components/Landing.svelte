<script lang="ts">
	import { SITE_URL } from '$lib/utils';

	const steps = [
		{
			title: 'Crea tu tienda',
			text: 'Regístrate con tu WhatsApp y agrega tus productos con fotos, precios y variantes en minutos.',
		},
		{
			title: 'Comparte tu link',
			text: `Te damos un enlace corto (${SITE_URL.replace(/^https?:\/\//, '')}/@tu-tienda) perfecto para WhatsApp, Instagram o tu bio.`,
		},
		{
			title: 'Recibe pedidos directo',
			text: 'El cliente arma su carrito y te llega el pedido completo por WhatsApp, listo para coordinar pago y entrega.',
		},
	];

	const features = [
		{ title: 'Pedidos por WhatsApp', text: 'Cada pedido llega a tu WhatsApp con productos, cantidades, datos del cliente y método de pago elegido.' },
		{ title: 'Pago por transferencia', text: 'Ofrece tus cuentas (BANDEC, BPA, Metropolitano o MiTransfer) y el cliente sube el comprobante del pago en el propio checkout.' },
		{ title: 'Multimoneda', text: 'Pon precios en tu moneda base y muestra tus propios tipos de cambio para las otras.' },
		{ title: 'Rastreo de pedidos', text: 'Tus clientes ven el estado de su pedido con el número que les das, sin tener que preguntarte.' },
		{ title: 'Estadísticas', text: 'Visitas diarias, pedidos y productos agotados: sabes qué vende y cuándo te visitan.' },
		{ title: 'Sin comisiones', text: 'No cobramos por venta ni retenemos tu dinero. Tú recibes el pago como siempre, 100% directo.' },
	];

	const faqs = [
		{
			q: '¿Cuánto cuesta Tiendly?',
			a: 'El plan Gratis incluye 1 tienda y hasta 10 productos, sin costo y sin tarjeta. Hacemos Tiendly sostenible solo si necesitas más espacio en el futuro.',
		},
		{
			q: '¿Cómo recibo el pago de mis clientes?',
			a: 'Directo, por fuera de Tiendly: efectivo, transferencia a tus cuentas o lo que tú elijas. Nunca tocamos tu dinero ni cobramos por venta.',
		},
		{
			q: '¿Necesito saber de tecnología?',
			a: 'No. El catálogo se administra desde un panel simple: agregas productos con el teléfono y tu tienda queda lista para compartir.',
		},
		{
			q: '¿Puedo tener mi tienda con otro idioma o moneda?',
			a: 'La interfaz es en español, pero puedes configurar varios tipos de cambio para que tus clientes vean precios en su moneda.',
		},
	];
</script>

<main>
	<section class="relative overflow-hidden max-w-full">
	<div class="absolute inset-0 bg-gradient-to-b from-canvas/85 via-canvas/60 to-canvas/85" aria-hidden="true"></div>
	<div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
		<h1 class="text-4xl sm:text-6xl font-black tracking-tight text-ink max-w-3xl mx-auto leading-[1.05]">
			Tu tienda online y los pedidos en tu <span class="text-ember">WhatsApp</span>
		</h1>
		<p class="text-lg text-body mt-5 max-w-xl mx-auto">
			Crea tu catálogo en minutos, comparte tu link y recibe pedidos directo. Sin comisiones, sin intermediarios y sin plataformas de pago ajenas.
		</p>
		<div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
			<a href="/wizard" class="cta-primary">Crear mi tienda gratis</a>
			<a
				href="/tiendas"
				class="inline-flex items-center justify-center gap-2 bg-ink text-canvas px-8 py-4 rounded-[14px] text-base font-semibold hover:opacity-85 transition-opacity no-underline w-full sm:w-auto"
			>
				Explorar tiendas
			</a>
		</div>
	</div>
	</section>

	<section class="border-y border-hairline bg-card/40">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink text-center mb-3">Cómo funciona</h2>
			<p class="text-body text-center max-w-lg mx-auto mb-12">De alta a tu primer pedido en menos de 10 minutos.</p>
			<div class="grid gap-6 md:grid-cols-3">
				{#each steps as s, i}
					<div class="bg-card border border-hairline rounded-card p-6 relative">
						<span class="absolute top-5 right-5 text-4xl font-black text-hairline select-none">{i + 1}</span>
						<h3 class="font-bold text-ink mb-1.5">{s.title}</h3>
						<p class="text-sm text-body leading-relaxed">{s.text}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink text-center mb-12">Todo lo que necesitas para vender</h2>
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as f}
				<div class="bg-card border border-hairline rounded-card p-5">
					<div>
						<i class="text-lg"></i>
					</div>
					<h3 class="font-bold text-ink mb-1 text-sm">{f.title}</h3>
					<p class="text-sm text-body leading-relaxed">{f.text}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="border-t border-hairline">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink mb-3">Todo gratis. Sin comisiones.</h2>
			<p class="text-body max-w-md mx-auto mb-8">
				Tiendly es gratis mientras lo necesites: 1 tienda y hasta 10 productos. Sin tarjeta, sin letra pequeña y sin cobros por venta.
			</p>
			<a href="/wizard" class="cta-primary">Crear mi tienda gratis</a>
		</div>
	</section>

	<section class="border-t border-hairline">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink text-center mb-10">Preguntas frecuentes</h2>
			<div class="space-y-3">
				{#each faqs as f}
					<details class="group bg-card border border-hairline rounded-card overflow-hidden">
						<summary class="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-semibold text-ink text-sm list-none">
							{f.q}
							<i class="ri-add-line text-muted transition-transform group-open:rotate-45 text-base"></i>
						</summary>
						<p class="px-5 pb-4 text-sm text-body leading-relaxed">{f.a}</p>
					</details>
				{/each}
			</div>
		</div>
	</section>
</main>