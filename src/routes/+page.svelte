<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Squiggle from '$lib/components/Squiggle.svelte';
	import DoodleArrow from '$lib/components/DoodleArrow.svelte';
	import SocialProof from '$lib/components/SocialProof.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	$effect(() => { auth.init(); });

	let openFaq = $state<string | null>(null);

	const faqs = [
		{
			q: '¿Qué es Tiendly?',
			a: 'Es una plataforma para crear tu tienda online en minutos: agregas tus productos y los clientes hacen pedidos que te llegan directo a tu WhatsApp.',
		},
		{
			q: '¿Cuánto cuesta?',
			a: 'Empezar es gratis y sin tarjeta. Cuando quieras crecer, hay planes Pro y Premium con más tiendas y productos, con precios en USD que se pagan en cripto (USDT).',
		},
		{
			q: '¿Necesito saber programar?',
			a: 'No. Creas tu tienda con un asistente de 4 pasos: nombre, productos, color y tu WhatsApp. Lista para compartir.',
		},
		{
			q: '¿Cómo recibo los pedidos?',
			a: 'Cada pedido llega como mensaje de WhatsApp con el detalle de productos, cantidades y datos del cliente. Tú lo confirmas y acuerdan la entrega.',
		},
		{
			q: '¿Puedo tener más de una tienda?',
			a: 'El plan Free incluye 1 tienda. Con Pro puedes tener hasta 5 y con Premium hasta 15.',
		},
		{
			q: '¿Cómo se pagan los planes?',
			a: 'Los precios están en USD y el pago se hace en criptomonedas (USDT). Al elegir un plan recibes la dirección de pago e instrucciones.',
		},
	];

	const benefits = [
		{
			icon: 'ri-whatsapp-line',
			title: 'Pedidos directo a tu WhatsApp',
			text: 'Cada pedido llega como mensaje con el detalle de productos, cantidades y datos del cliente. Tú lo confirmas y listo.',
		},
		{
			icon: 'ri-percent-line',
			title: 'Sin comisiones por venta',
			text: 'No cobramos por cada pedido ni necesitas pasarela de pago. Tú y tu cliente acuerdan el pago como prefieran.',
		},
		{
			icon: 'ri-bank-card-line',
			title: 'Gratis, sin tarjeta',
			text: 'Crea tu tienda gratis sin registrar tarjeta. Solo pagas si algún día quieres crecer a un plan superior.',
		},
		{
			icon: 'ri-timer-line',
			title: 'Lista en 5 minutos',
			text: 'Nombre, productos, color y tu WhatsApp. Cuatro pasos y tu tienda queda lista para compartir.',
		},
		{
			icon: 'ri-price-tag-3-line',
			title: 'Productos con todo',
			text: 'Fotos, precios en tu moneda, categorías y variantes (tallas, colores, cantidades). Sin límites para tu catálogo.',
		},
		{
			icon: 'ri-store-2-line',
			title: 'Control total de tu tienda',
			text: 'Edita productos, cambia el color, oculta la tienda cuando quieras y sigue cada pedido desde el panel.',
		},
	];

	const steps = [
		{
			icon: 'ri-user-add-line',
			title: 'Crea tu cuenta',
			text: 'Regístrate gratis con tu correo en menos de un minuto. Sin tarjeta y sin compromisos.',
		},
		{
			icon: 'ri-function-add-line',
			title: 'Agrega tus productos',
			text: 'Nombre, precio, foto y variantes. Personaliza el color y tu número de WhatsApp.',
		},
		{
			icon: 'ri-share-forward-line',
			title: 'Comparte y vende',
			text: 'Comparte tu tienda en WhatsApp, Telegram o redes. Los pedidos te llegan solos.',
		},
	];
</script>

<svelte:head>
	<title>Tiendly | Tu tienda online en 5 minutos</title>
	<meta name="description" content="Crea tu tienda online gratis, agrega tus productos y compártela por WhatsApp en menos de 5 minutos. Sin tarjetas, sin comisiones, sin complicaciones." />
</svelte:head>

<nav class="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<Logo />
			{#if auth.session}
				<a href="/app" class="bg-ember text-white px-5 py-2 rounded-btn text-sm font-medium transition-all hover:bg-ember-active no-underline">
					Mi cuenta
				</a>
			{:else}
				<div class="flex items-center gap-4">
					<a href="/login" class="text-sm font-medium text-body hover:text-ink transition-colors no-underline">
						Iniciar sesión
					</a>
					<a href="/wizard" class="bg-ember text-white px-5 py-2 rounded-btn text-sm font-medium transition-all hover:bg-ember-active no-underline">
						Comenzar gratis
					</a>
				</div>
			{/if}
		</div>
	</div>
</nav>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
	<div class="text-center pt-20 pb-16 sm:pt-24 sm:pb-20">
		<div class="inline-flex items-center gap-2 bg-ember/10 border border-ember/20 rounded-full px-4 py-1.5 mb-6 text-xs font-medium text-ember">
			<i class="ri-timer-line"></i>
			Tu tienda lista en menos de 5 minutos
		</div>
		<h1 class="text-4xl sm:text-6xl font-black tracking-tight text-ink leading-tight">
			Crea tu tienda online
			<span class="relative inline-block text-ember">
				en 5 minutos
				<Squiggle class="absolute -bottom-2 left-0 w-full h-3 text-ember" />
			</span>
		</h1>
		<p class="max-w-xl mx-auto mt-6 text-base sm:text-lg text-body leading-relaxed">
			Agrega tus productos y comparte tu tienda por WhatsApp, Telegram o redes sociales.
			Gratis, sin tarjetas y sin comisiones por venta.
		</p>
		<div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
			<a href={'/wizard'} class="w-full sm:w-auto bg-ember text-white px-8 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline">
				Crear mi tienda gratis
			</a>
			<a href={'/pricing'} class="w-full sm:w-auto px-8 py-3.5 border border-hairline text-body rounded-btn text-base font-medium transition-colors hover:bg-bone no-underline">
				Ver los planes
			</a>
		</div>
		<div class="hidden md:flex justify-end max-w-2xl mx-auto mt-2">
			<DoodleArrow class="w-16 h-14 text-ember/80 -rotate-12 -mt-16 mr-6" />
		</div>
	</div>

	<SocialProof />

	<div class="pt-20 sm:pt-24 pb-10">
		<h2 class="text-2xl sm:text-3xl font-bold text-ink text-center mb-4">
			Por qué <span class="text-ember text-3xl sm:text-4xl">Tiendly</span>
		</h2>
		<p class="text-center text-body max-w-lg mx-auto mb-10">Todo lo que necesitas para vender, sin los dolores de cabeza de una tienda tradicional.</p>
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
			{#each benefits as b}
				<div class="bg-card border border-hairline rounded-card p-6 transition-all duration-300 hover:border-ember/50 hover:shadow-sm">
					<div class="w-11 h-11 flex items-center justify-center bg-ember/10 rounded-full mb-4">
						<i class="{b.icon} text-xl text-ember"></i>
					</div>
					<h3 class="text-base font-bold text-ink mb-1.5">{b.title}</h3>
					<p class="text-sm text-body leading-relaxed">{b.text}</p>
				</div>
			{/each}
		</div>
	</div>

	<div class="py-10">
		<h2 class="text-2xl sm:text-3xl font-bold text-ink text-center mb-4">
			Tu tienda en <span class="text-ember text-3xl sm:text-4xl">3 pasos</span>
		</h2>
		<p class="text-center text-body max-w-lg mx-auto mb-10">Desde cero hasta tu primera venta, sin escribir una línea de código.</p>
		<div class="grid sm:grid-cols-3 gap-4 sm:gap-6">
			{#each steps as step, i}
				<div class="relative bg-card border border-hairline rounded-card p-6 transition-transform duration-300 hover:-translate-y-1">
					<div class="flex items-center justify-between mb-4">
						<div class="w-11 h-11 flex items-center justify-center bg-ember/10 rounded-full">
							<i class="{step.icon} text-xl text-ember"></i>
						</div>
						<span class="text-4xl font-black text-ember/15 select-none">{i + 1}</span>
					</div>
					<h3 class="text-lg font-bold text-ink mb-1.5">{step.title}</h3>
					<p class="text-sm text-body leading-relaxed">{step.text}</p>
				</div>
			{/each}
		</div>
	</div>

	<div class="max-w-2xl mx-auto py-10 sm:py-16">
		<h2 class="text-2xl sm:text-3xl font-bold text-ink text-center mb-10">
			Preguntas <span class="text-ember text-3xl sm:text-4xl">frecuentes</span>
		</h2>
		<div class="space-y-3">
			{#each faqs as faq}
				<div class="bg-card border border-hairline rounded-card overflow-hidden">
					<button
						onclick={() => (openFaq = openFaq === faq.q ? null : faq.q)}
						class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
						aria-expanded={openFaq === faq.q}
					>
						<span class="font-semibold text-ink text-sm">{faq.q}</span>
						<i class={`ri-arrow-down-s-line text-lg text-muted transition-transform duration-200 flex-shrink-0 ${openFaq === faq.q ? 'rotate-180 text-ember' : ''}`}></i>
					</button>
					{#if openFaq === faq.q}
						<p class="px-5 pb-4 text-sm text-body leading-relaxed">{faq.a}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="bg-card border border-hairline rounded-card p-8 sm:p-12 mb-20 text-center">
		<h2 class="text-2xl sm:text-3xl font-bold text-ink mb-3">
			<span class="text-ember text-3xl sm:text-4xl mr-2">¿Listo</span>para vender?
		</h2>
		<p class="text-body max-w-md mx-auto mb-6">Tu tienda online te toma 5 minutos. Sin tarjetas, sin comisiones, sin complicaciones.</p>
		<a href={'/wizard'} class="inline-flex bg-ember text-white px-8 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline">
			Empezar ahora
		</a>
	</div>
</section>

<Footer />
