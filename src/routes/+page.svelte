<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	$effect(() => { auth.init(); });
</script>

<svelte:head>
	<title>Tiendly | Tu tienda online, sin intermediarios</title>
	<meta name="description" content="Crea tu catálogo, comparte tu link y recibe pedidos directo en tu WhatsApp. Sin plataformas de pago ajenas, sin comisiones por venta." />
</svelte:head>

<nav class="sticky top-0 z-50 bg-canvas/85 backdrop-blur-md border-b border-hairline">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
		<a href="/" class="font-black text-lg tracking-tight text-ink no-underline">Tiendly</a>
		<div class="flex items-center gap-5">
			{#if auth.session}
				<a href="/dash" class="bg-ink text-canvas px-4 py-2 rounded-btn text-sm font-semibold transition-opacity hover:opacity-85 no-underline">
					Mi cuenta
				</a>
			{:else}
				<a href="/login" class="text-sm font-medium text-body hover:text-ink transition-colors no-underline">
					Iniciar sesión
				</a>
				<a href="/wizard" class="bg-ink text-canvas px-4 py-2 rounded-btn text-sm font-semibold transition-opacity hover:opacity-85 no-underline">
					Comenzar gratis
				</a>
			{/if}
		</div>
	</div>
</nav>

<header class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-20 sm:pb-28">
	<p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-soft mb-8">
		Tiendly — Plataforma de venta directa
	</p>
	<h1 class="text-5xl sm:text-7xl lg:text-[5.5rem] font-black tracking-tight text-ink leading-[1.02] max-w-4xl">
		Tu tienda online,
		<span class="italic font-black">sin intermediarios.</span>
	</h1>
	<p class="mt-8 max-w-2xl text-base sm:text-lg text-body leading-relaxed">
		Crea tu catálogo, comparte tu link y recibe pedidos directo en tu WhatsApp.
		Sin plataformas de pago ajenas, sin comisiones por venta, sin tarjetas.
	</p>
	<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-10">
		<a href="/wizard" class="inline-flex items-center justify-center bg-ink text-canvas px-8 py-3.5 rounded-btn text-base font-semibold transition-opacity hover:opacity-85 active:scale-[0.98] no-underline">
			Crear mi tienda gratis
		</a>
		<a href="/pricing" class="inline-flex items-center justify-center px-8 py-3.5 border border-hairline text-ink rounded-btn text-base font-medium transition-colors hover:bg-bone no-underline">
			Ver los planes
		</a>
	</div>

	<div class="grid sm:grid-cols-3 gap-6 sm:gap-0 mt-20 sm:mt-24 border-t border-hairline">
		<div class="pt-8 sm:pl-8 sm:border-l border-hairline sm:first:border-l-0 sm:first:pl-0">
			<p class="text-3xl font-black text-ink tabular-nums">5 min</p>
			<p class="mt-1 text-sm text-muted">de catálogo a tienda publicada</p>
		</div>
		<div class="pt-8 sm:pl-8 sm:border-l border-hairline sm:first:border-l-0 sm:first:pl-0">
			<p class="text-3xl font-black text-ink tabular-nums">0%</p>
			<p class="mt-1 text-sm text-muted">comisión por venta</p>
		</div>
		<div class="pt-8 sm:pl-8 sm:border-l border-hairline sm:first:border-l-0 sm:first:pl-0">
			<p class="text-3xl font-black text-ink tabular-nums">1 link</p>
			<p class="mt-1 text-sm text-muted">para todo tu catálogo</p>
		</div>
	</div>
</header>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
	<p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-soft mb-6">
		Por qué directo
	</p>
	<h2 class="text-4xl sm:text-5xl font-black tracking-tight text-ink leading-tight max-w-3xl">
		Vender directo no es un truco. Es un negocio mejor.
	</h2>

	<div class="grid md:grid-cols-3 gap-10 mt-16">
		<div class="border-t border-ink pt-6">
			<p class="text-4xl font-black text-muted-soft">01</p>
			<h3 class="text-xl font-bold text-ink mt-4">Sin plataformas de pago</h3>
			<p class="text-sm text-body leading-relaxed mt-2">
				No dependes de un checkout ajeno ni de retenciones de días. Tu cliente te escribe y tú cobras como siempre: efectivo, transferencia o tu app favorita.
			</p>
		</div>
		<div class="border-t border-ink pt-6">
			<p class="text-4xl font-black text-muted-soft">02</p>
			<h3 class="text-xl font-bold text-ink mt-4">Pedidos a tu WhatsApp</h3>
			<p class="text-sm text-body leading-relaxed mt-2">
				Cada pedido llega a tu chat, con los productos y el total listos. Lo atiendes tú, en tu tono, sin embudos fríos ni intermediarios.
			</p>
		</div>
		<div class="border-t border-ink pt-6">
			<p class="text-4xl font-black text-muted-soft">03</p>
			<h3 class="text-xl font-bold text-ink mt-4">Cero comisiones por venta</h3>
			<p class="text-sm text-body leading-relaxed mt-2">
				Tiendly no cobra por transacción. Si algún día quieres más, pagas un plan fijo y nada más. Tu margen es tuyo, entero.
			</p>
		</div>
	</div>
</section>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 border-t border-hairline">
	<p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-soft mb-6">
		Cómo funciona
	</p>
	<h2 class="text-4xl sm:text-5xl font-black tracking-tight text-ink leading-tight max-w-3xl">
		De cero a vendiendo en cinco minutos.
	</h2>

	<div class="grid md:grid-cols-3 gap-10 mt-16">
		<div class="border-t border-ink pt-6">
			<p class="text-4xl font-black text-muted-soft">01</p>
			<h3 class="text-xl font-bold text-ink mt-4">Crea tu catálogo</h3>
			<p class="text-sm text-body leading-relaxed mt-2">
				Agrega tus productos con fotos, variantes y precios desde el panel. Nada de código, nada de configuraciones eternas.
			</p>
		</div>
		<div class="border-t border-ink pt-6">
			<p class="text-4xl font-black text-muted-soft">02</p>
			<h3 class="text-xl font-bold text-ink mt-4">Comparte tu link</h3>
			<p class="text-sm text-body leading-relaxed mt-2">
				Tu tienda vive en su propia dirección. Pégala en WhatsApp, Telegram, Instagram o donde vendas hoy.
			</p>
		</div>
		<div class="border-t border-ink pt-6">
			<p class="text-4xl font-black text-muted-soft">03</p>
			<h3 class="text-xl font-bold text-ink mt-4">Cobra a tu manera</h3>
			<p class="text-sm text-body leading-relaxed mt-2">
				El cliente arma su pedido y te escribe por WhatsApp para cerrar el trato. El dinero pasa directo entre ustedes.
			</p>
		</div>
	</div>
</section>

<section class="bg-ink text-canvas">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
		<p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-canvas/50 mb-6">
			El panel
		</p>
		<h2 class="text-4xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl">
			Todo tu negocio en un solo lugar.
		</h2>
		<p class="mt-6 max-w-2xl text-base text-canvas/70 leading-relaxed">
			Sin dashboards de 40 opciones. Lo que necesitas para vender: tu catálogo, tus pedidos y las cifras que importan.
		</p>

		<div class="grid md:grid-cols-3 gap-4 mt-14">
			<div class="bg-white/[0.04] border border-white/10 rounded-card p-6">
				<p class="text-sm font-bold text-canvas">Catálogo</p>
				<p class="text-sm text-canvas/60 leading-relaxed mt-2">
					Productos con fotos, variantes, precios y estado de stock. Organizados como tu negocio, no como una hoja de cálculo.
				</p>
			</div>
			<div class="bg-white/[0.04] border border-white/10 rounded-card p-6">
				<p class="text-sm font-bold text-canvas">Pedidos</p>
				<p class="text-sm text-canvas/60 leading-relaxed mt-2">
					Cada pedido con sus productos, datos del cliente y estado. Los marcas como pendiente o entregado y sigue tu día.
				</p>
			</div>
			<div class="bg-white/[0.04] border border-white/10 rounded-card p-6">
				<p class="text-sm font-bold text-canvas">Datos</p>
				<p class="text-sm text-canvas/60 leading-relaxed mt-2">
					Visitas por tienda, pedidos recibidos y lo que te queda por atender. Lo justo para saber cómo va el negocio.
				</p>
			</div>
		</div>

		<a href="/dash" class="inline-flex items-center gap-2 mt-10 text-sm font-semibold text-canvas border-b border-canvas/40 pb-1 hover:border-canvas transition-colors no-underline">
			Entrar al panel
			<i class="ri-arrow-right-line"></i>
		</a>
	</div>
</section>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-36 text-center">
	<h2 class="text-4xl sm:text-6xl font-black tracking-tight text-ink leading-tight max-w-3xl mx-auto">
		Tu tienda está a cinco minutos.
	</h2>
	<p class="mt-6 text-base text-body max-w-xl mx-auto leading-relaxed">
		Gratis para empezar. Sin tarjetas, sin comisiones por venta y sin letra chica.
	</p>
	<div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
		<a href="/wizard" class="inline-flex items-center justify-center bg-ink text-canvas px-10 py-4 rounded-btn text-base font-semibold transition-opacity hover:opacity-85 active:scale-[0.98] no-underline">
			Crear mi tienda gratis
		</a>
		<a href="/pricing" class="inline-flex items-center justify-center px-8 py-4 border border-hairline text-ink rounded-btn text-base font-medium transition-colors hover:bg-bone no-underline">
			Ver los planes
		</a>
	</div>
</section>

<Footer />
