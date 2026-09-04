<script lang="ts">
	import { goto } from '$app/navigation';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Landing from '$lib/components/Landing.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { SITE_URL } from '$lib/utils';

	$effect(() => {
		auth.init();
	});
	$effect(() => {
		if (auth.ready && auth.session) goto('/home');
	});
</script>

<svelte:head>
	<title>Tiendly | Catálogo online y pedidos para tu negocio</title>
	<meta name="description" content="Crea tu catálogo online, compártelo y recibe pedidos organizados de tus clientes. Tiendly te ayuda a mostrar tus productos y vender de forma sencilla." />
	<script type="application/ld+json">
		{JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Tiendly',
			url: SITE_URL,
			logo: `${SITE_URL}/isotipo.webp`,
			sameAs: ['https://wa.me/5363807214'],
		})}
	</script>
	<script type="application/ld+json">
		{JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Tiendly',
			url: SITE_URL,
			potentialAction: {
				'@type': 'SearchAction',
				target: `${SITE_URL}/tiendas?q={search_term_string}`,
				'query-input': 'required name=search_term_string',
			},
		})}
	</script>
</svelte:head>

<div class="w-full bg-ember/10 border-b border-ember/20">
	<a href="https://t.me/+dFQ2WyJvCkg4YmFh" target="_blank" rel="noopener noreferrer" class="group mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6 text-xs font-medium text-body hover:text-ember transition-colors sm:text-sm">
		<i class="ri-telegram-fill text-[#2AABEE] text-base shrink-0"></i>
		<span><span class="font-bold text-ember">Tiendly está en beta.</span> Únete al canal de Telegram para dar feedback y recibir novedades.</span>
		<i class="ri-arrow-right-s-line ml-auto text-muted group-hover:text-ember shrink-0"></i>
	</a>
</div>
<MarketingNav />
<Landing />
<Footer />
