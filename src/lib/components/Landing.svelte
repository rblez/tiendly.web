<script module lang="ts">
	export const landingFaqs = [
		{
			q: '¿Cuánto cuesta Tiendly?',
			a: 'El plan Gratis incluye 1 tienda y hasta 10 productos, sin costo y sin tarjeta. Solo pagas si necesitas más espacio en el futuro.',
		},
		{
			q: '¿Cómo recibo el pago de mis clientes?',
			a: 'Directo, por fuera de Tiendly: el cliente transfiere a tus cuentas, sube el comprobante y tú confirmas. Nunca tocamos tu dinero ni cobramos por venta.',
		},
		{
			q: '¿Necesito saber de tecnología?',
			a: 'No. El catálogo se administra desde un panel simple en tu teléfono. Agregas productos y tu tienda queda lista para compartir.',
		},
		{
			q: '¿Funciona para Cuba?',
			a: 'Sí. Tiendly está diseñado para el mercado cubano: admite CUP y USD, y los métodos de pago incluyen BANDEC, BPA, BANMET, MiTransfer, Saldo Móvil, Zelle, USDT y más.',
		},
	];
</script>

<script lang="ts">
	import { SITE_URL } from '$lib/utils';

	const steps = [
		{
			icon: 'ri-store-3-line',
			title: 'Crea tu tienda',
			text: 'Regístrate y agrega tus productos con fotos, precios y variantes en minutos.',
		},
		{
			icon: 'ri-links-line',
			title: 'Comparte tu link',
			text: `Un enlace corto (${SITE_URL.replace(/^https?:\/\//, '')}/@tu-tienda) listo para WhatsApp, Instagram o tu bio.`,
		},
		{
			icon: 'ri-shopping-bag-3-line',
			title: 'Recibe pedidos',
			text: 'El cliente arma su carrito, sube el comprobante de pago y el pedido te llega listo al panel.',
		},
	];

	 const showcase = [
	{
		title: 'Tu tienda, impecable en cualquier pantalla',
		text: 'Un link corto que abre una vitrina rápida y ordenada. Fotos, precios y variantes claras para que comprar sea fácil.',
		img: '/feature-1.webp',
		alt: 'Tienda de Tiendly en móvil',
		ready: true,
	},
	{
		title: 'Cobra como tú quieras, sin intermediarios',
		text: 'Crea tus propios métodos de pago — Zelle, BANDEC, USDT, efectivo — con tus datos y el cliente sube el comprobante al hacer el pedido.',
		img: '/feature-2.webp',
		alt: 'Métodos de pago personalizados en Tiendly',
		ready: true,
	},
	{
		title: 'Gestiona todo desde el panel',
		text: 'Productos, pedidos, métodos de pago y envíos en un solo lugar. Sin correos ni apps extra.',
		img: '/feature-3.webp',
		alt: 'Panel de control de Tiendly',
		ready: true,
	},
];
	const faqs = landingFaqs;

	const socials = [
		{ icon: 'ri-telegram-fill', href: 'https://t.me/+dFQ2WyJvCkg4YmFh', label: 'Telegram' },
		{ icon: 'ri-instagram-line', href: 'https://instagram.com/tiendly.lat', label: 'Instagram' },
	];

	let showModal = $state(false);

	$effect(() => {
		const key = 'tg_modal_seen';
		if (!sessionStorage.getItem(key)) {
			setTimeout(() => { showModal = true; }, 3000);
			sessionStorage.setItem(key, '1');
		}
	});
</script>

{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-transparent sm:items-center"
		onclick={(e) => { if (e.target === e.currentTarget) showModal = false; }}
		role="presentation"
	>
		<div class="w-full sm:max-w-sm bg-card border border-hairline rounded-t-card sm:rounded-card shadow-2xl p-6 text-center">
			<button
				type="button"
				onclick={() => (showModal = false)}
				class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted hover:text-error hover:bg-error/10 rounded-btn cursor-pointer"
				aria-label="Cerrar"
			><i class="ri-close-line"></i></button>
			<i class="ri-telegram-fill text-5xl text-[#2AABEE] mb-3 block"></i>
			<h3 class="text-lg font-bold text-ink mb-2">Tiendly está en beta</h3>
			<p class="text-sm text-body mb-5 leading-relaxed">
				Tu feedback nos ayuda a construir la mejor plataforma de ecommerce para Cuba.
				Únete al grupo de Telegram para reportar bugs, pedir features y ver novedades antes que nadie.
			</p>
			<a
				href="https://t.me/+EgoH1iuFRIcwNjFh"
				target="_blank"
				rel="noopener noreferrer"
				class="cta-primary flex items-center justify-center gap-2 w-full no-underline"
				onclick={() => (showModal = false)}
			>
				<i class="ri-telegram-fill"></i>
				Unirme al grupo
			</a>
			<button
				type="button"
				onclick={() => (showModal = false)}
				class="mt-3 text-xs text-muted hover:text-body cursor-pointer"
			>Ahora no</button>
		</div>
	</div>
{/if}

<main>
	<!-- Hero -->
	<section class="relative overflow-hidden max-w-full">
		<div class="absolute inset-0 bg-gradient-to-b from-canvas/85 via-canvas/60 to-canvas/85" aria-hidden="true"></div>
		<div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
			<span class="inline-flex items-center gap-1.5 bg-ember/10 border border-ember/20 text-ember text-xs font-semibold px-3 py-1 rounded-full mb-5">
				<i class="ri-pulse-line"></i> Beta abierta · Cuba-first
			</span>
			<h1 class="text-4xl sm:text-6xl font-black tracking-tight text-ink max-w-3xl mx-auto leading-[1.05]">
				Tu catálogo online para vender <span class="text-ember">sin comisiones</span>
			</h1>
			<p class="text-lg text-body mt-5 max-w-xl mx-auto">
				Crea tu tienda en minutos, comparte tu enlace y recibe pedidos con comprobante incluido. Tú cobras, tú coordinas.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
				<a href="/wizard" class="cta-primary">Crear mi tienda gratis</a>
				<a href="/tiendas" class="inline-flex items-center justify-center gap-2 bg-card border border-hairline text-ink px-8 py-4 rounded-[14px] text-base font-semibold hover:border-ember/40 transition-colors no-underline w-full sm:w-auto">
					<i class="ri-store-3-line"></i> Ver tiendas
				</a>
			</div>
		</div>
	</section>

	<!-- Cómo funciona -->
	<section class="border-y border-hairline bg-card/40">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink text-center mb-3">Cómo funciona</h2>
			<p class="text-body text-center max-w-lg mx-auto mb-12">De alta a tu primer pedido en menos de 10 minutos.</p>
			<div class="grid gap-6 md:grid-cols-3">
				{#each steps as s, i}
					<div class="bg-card border border-hairline rounded-card p-6 relative">
						<span class="absolute top-5 right-5 text-4xl font-black text-hairline select-none">{i + 1}</span>
						<i class="ri-{s.icon.replace('ri-','')} text-ember text-2xl mb-3 block"></i>
						<h3 class="font-bold text-ink mb-1.5">{s.title}</h3>
						<p class="text-sm text-body leading-relaxed">{s.text}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Features showcase -->
	<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink text-center mb-12">Todo lo que necesitas para vender</h2>
		<div class="space-y-14 sm:space-y-20">
			{#each showcase as f, i}
				<div class="grid gap-6 lg:gap-12 md:grid-cols-2 md:items-center">
					<div class="w-full aspect-[4/3] rounded-card border border-hairline overflow-hidden {i % 2 === 1 ? 'md:order-2' : ''}
						{f.ready ? '' : 'bg-gradient-to-br from-ember/10 via-ember/5 to-canvas flex items-center justify-center'}">
						{#if f.ready}
							<img src={f.img} alt={f.alt} width="800" height="600" loading="lazy" class="w-full h-full object-cover" />
						{:else}
							<div class="text-center p-8">
								<i class="ri-image-add-line text-4xl text-ember/40 mb-3 block"></i>
								<p class="text-xs text-muted-soft">Próximamente</p>
							</div>
						{/if}
					</div>
					<div class="{i % 2 === 1 ? 'md:order-1' : ''}">
						<h3 class="text-xl sm:text-2xl font-bold text-ink mb-2">{f.title}</h3>
						<p class="text-body leading-relaxed">{f.text}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- CTA -->
	<section class="border-t border-hairline">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink mb-3">Todo gratis. Sin comisiones.</h2>
			<p class="text-body max-w-md mx-auto mb-8">
				1 tienda y hasta 10 productos sin costo. Sin tarjeta, sin letra pequeña y sin cobros por venta.
			</p>
			<a href="/wizard" class="cta-primary">Crear mi tienda gratis</a>
		</div>
	</section>

	<!-- FAQ -->
	<section class="border-t border-hairline">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-ink text-center mb-10">Preguntas frecuentes</h2>
			<div class="space-y-3">
				{#each faqs as f}
					<details class="group bg-card border border-hairline rounded-card overflow-hidden">
						<summary class="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-semibold text-ink text-sm list-none">
							{f.q}
							<i class="ri-add-line text-muted transition-transform group-open:rotate-45 text-base shrink-0"></i>
						</summary>
						<p class="px-5 pb-4 text-sm text-body leading-relaxed">{f.a}</p>
					</details>
				{/each}
			</div>
		</div>
	</section>


</main>
