<script lang="ts">
	import { goto } from '$app/navigation';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Landing, { landingFaqs } from '$lib/components/Landing.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { SITE_URL } from '$lib/utils';

	$effect(() => {
		auth.init();
	});
	$effect(() => {
		if (auth.ready && auth.session) goto('/home');
	});

	const jsonLd = [
		{
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Tiendly',
			url: SITE_URL,
			logo: `${SITE_URL}/tiendly-logo.webp`,
			sameAs: [
				'https://instagram.com/tiendly.latam',
				'https://facebook.com/tiendly.latam',
				'https://t.me/tiendly_lat',
				'https://x.com/tiendly_lat',
				'https://github.com/tiendly',
			],
		},
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Tiendly',
			url: SITE_URL,
			potentialAction: {
				'@type': 'SearchAction',
				target: `${SITE_URL}/tiendas?q={search_term_string}`,
				'query-input': 'required name=search_term_string',
			},
		},
		{
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: landingFaqs.map((f) => ({
				'@type': 'Question',
				name: f.q,
				acceptedAnswer: { '@type': 'Answer', text: f.a },
			})),
		},
	];
</script>

<Seo
	title="Tiendly | Catálogo online y pedidos para tu negocio"
	description="Crea tu catálogo online, compártelo y recibe pedidos organizados de tus clientes. Tiendly te ayuda a mostrar tus productos y vender de forma sencilla."
	canonical={SITE_URL + '/'}
	image={SITE_URL + '/og-banner.webp'}
	imageAlt="Tiendly: crea tu catálogo online y recibe pedidos"
	imageSize={{ w: 1536, h: 1024 }}
	jsonLd={jsonLd}
/>

<MarketingNav />
<Landing />
<Footer />
