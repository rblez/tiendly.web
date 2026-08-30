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

<MarketingNav />
<Landing />
<Footer />
