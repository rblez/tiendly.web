<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Squiggle from '$lib/components/Squiggle.svelte';
	import DoodleArrow from '$lib/components/DoodleArrow.svelte';
	import SocialProof from '$lib/components/SocialProof.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	$effect(() => { auth.init(); });
</script>

<svelte:head>
	<title>Tiendly | Tu tienda online en 5 minutos</title>
	<meta name="description" content="Crea tu tienda online gratis, agrega tus productos y compártela por WhatsApp en menos de 5 minutos. Sin tarjetas, sin complicaciones." />
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
				<a href="/login" class="text-sm font-medium text-body hover:text-ink transition-colors no-underline">
					Iniciar sesión
				</a>
			{/if}
		</div>
	</div>
</nav>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
	<div class="text-center py-20 sm:py-28">
		<div class="inline-flex items-center gap-2 bg-ember/10 border border-ember/20 rounded-full px-4 py-1.5 mb-6 text-xs font-medium text-ember -rotate-1 font-hand text-base">
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
			Regístrate, agrega tus productos y comparte tu tienda por WhatsApp, Telegram o redes sociales.
			Gratis, sin tarjetas y sin complicaciones.
		</p>
		<div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
			<a href={'/create'} class="w-full sm:w-auto bg-ember text-white px-8 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline">
				Crear mi tienda gratis
			</a>
			<a href={auth.session ? '/app' : '/login'} class="w-full sm:w-auto px-8 py-3.5 border border-hairline text-body rounded-btn text-base font-medium transition-colors hover:bg-bone no-underline">
				Ver una tienda de ejemplo
			</a>
		</div>
		<div class="hidden md:flex justify-end max-w-2xl mx-auto mt-2">
			<DoodleArrow class="w-16 h-14 text-ember/80 -rotate-12 -mt-16 mr-6" />
		</div>
	</div>

	<SocialProof />

	<div class="grid sm:grid-cols-3 gap-4 sm:gap-6 pb-20">
		<div class="bg-card border border-hairline rounded-card p-6 sm:rotate-0 transition-transform duration-300 hover:-rotate-1">
			<div class="flex items-center justify-between mb-4">
				<div class="w-11 h-11 flex items-center justify-center bg-ember/10 rounded-full">
					<i class="ri-user-add-line text-xl text-ember"></i>
				</div>
				<span class="font-hand text-3xl text-ember/70 rotate-3">1</span>
			</div>
			<h3 class="text-lg font-bold text-ink mb-1.5">Regístrate</h3>
			<p class="text-sm text-body leading-relaxed">Crea tu cuenta gratis con tu correo. Solo toma un minuto.</p>
		</div>
		<div class="bg-card border border-hairline rounded-card p-6 sm:rotate-0 transition-transform duration-300 hover:rotate-1">
			<div class="flex items-center justify-between mb-4">
				<div class="w-11 h-11 flex items-center justify-center bg-ember/10 rounded-full">
					<i class="ri-store-2-line text-xl text-ember"></i>
				</div>
				<span class="font-hand text-3xl text-ember/70 -rotate-3">2</span>
			</div>
			<h3 class="text-lg font-bold text-ink mb-1.5">Agrega tus productos</h3>
			<p class="text-sm text-body leading-relaxed">Nombre, precio y descripción. Personaliza el color y tu número de WhatsApp.</p>
		</div>
		<div class="bg-card border border-hairline rounded-card p-6 sm:rotate-0 transition-transform duration-300 hover:-rotate-1">
			<div class="flex items-center justify-between mb-4">
				<div class="w-11 h-11 flex items-center justify-center bg-ember/10 rounded-full">
					<i class="ri-share-forward-line text-xl text-ember"></i>
				</div>
				<span class="font-hand text-3xl text-ember/70 rotate-2">3</span>
			</div>
			<h3 class="text-lg font-bold text-ink mb-1.5">Comparte tu tienda</h3>
			<p class="text-sm text-body leading-relaxed">Recibe pedidos directo en tu WhatsApp. Sin comisiones.</p>
		</div>
	</div>

	<div class="max-w-2xl mx-auto pb-20">
		<h2 class="text-2xl sm:text-3xl font-bold text-ink text-center mb-10">
			Preguntas <span class="font-hand text-ember text-3xl sm:text-4xl">frecuentes</span>
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
			<span class="font-hand text-ember text-3xl sm:text-4xl mr-2">¿Listo</span>para vender?
		</h2>
		<p class="text-body max-w-md mx-auto mb-6">Miles de emprendedores ya venden con Tiendly. Tú puedes ser el próximo.</p>
		<a href={'/create'} class="inline-flex bg-ember text-white px-8 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline">
			Empezar ahora
		</a>
	</div>
</section>

<Footer />
