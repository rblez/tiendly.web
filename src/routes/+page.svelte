<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import MockCatalog from '$lib/components/landing/MockCatalog.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	$effect(() => { auth.init(); });
</script>

<svelte:head>
	<title>Tiendly | Tu tienda online en 5 minutos</title>
	<meta name="description" content="Crea tu tienda online gratis, agrega tus productos y compártela por WhatsApp en menos de 5 minutos. Sin tarjetas, sin comisiones, sin complicaciones." />
</svelte:head>

<nav class="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<Logo size="h-10" />
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
	<div class="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center pt-16 pb-16 sm:pt-24 sm:pb-24">
		<div class="text-center lg:text-left">
			<div class="inline-flex items-center gap-2 bg-ember/10 border border-ember/20 rounded-full px-4 py-1.5 mb-6 text-xs font-medium text-ember">
				<i class="ri-timer-line"></i>
				Tu tienda lista en menos de 5 minutos
			</div>
			<h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink leading-tight">
				Crea tu tienda online
				<span class="text-ember">
					en 5 minutos
				</span>
			</h1>
			<p class="max-w-xl mx-auto lg:mx-0 mt-6 text-base sm:text-lg text-body leading-relaxed">
				Agrega tus productos y comparte tu tienda por WhatsApp, Telegram o redes sociales.
				Gratis, sin tarjetas y sin comisiones por venta.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-8">
				<a href={'/wizard'} class="w-full sm:w-auto bg-ember text-white px-8 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline">
					Crear mi tienda gratis
				</a>
				<a href={'/pricing'} class="w-full sm:w-auto px-8 py-3.5 border border-hairline text-body rounded-btn text-base font-medium transition-colors hover:bg-bone no-underline">
					Ver los planes
				</a>
			</div>
		</div>
		<div class="relative">
			<div class="absolute -top-10 -right-6 w-48 h-48 bg-ember/10 rounded-full blur-3xl"></div>
			<div class="absolute -bottom-8 -left-6 w-40 h-40 bg-ember/10 rounded-full blur-3xl"></div>
			<MockCatalog class="relative -rotate-1 hover:rotate-0 transition-transform duration-300" />
		</div>
	</div>
</section>

<Footer />
