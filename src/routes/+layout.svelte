<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import Analytics from '$lib/components/seo/Analytics.svelte';
	import ConsentBanner from '$lib/components/seo/ConsentBanner.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { consent } from '$lib/stores/consent.svelte';
	import { trackPageView } from '$lib/analytics';
	import { SITE_URL } from '$lib/utils';

	let { children } = $props();

	const origin = $derived(new URL($page.url).origin);
	const canonical = $derived(new URL($page.url.pathname, SITE_URL).href);

	$effect(() => {
		theme.init();
		consent.init();
		const tr = $page.url.searchParams.get('theme_refresh');
		if (tr === '1' || tr === '2' || tr === 'auto') {
			theme.set(tr === '1' ? 'dark' : tr === '2' ? 'light' : 'auto');
			const url = new URL($page.url.href);
			url.searchParams.delete('theme_refresh');
			history.replaceState(history.state, '', url);
		}
	});

	afterNavigate(() => {
		if (consent.granted) trackPageView();
	});
</script>

<svelte:head>
	<title>Tiendly | Tu tienda online, sin intermediarios</title>
	<meta name="description" content="Crea tu tienda online gratis, agrega productos y compártela por WhatsApp. Pedidos directos, sin comisiones ni intermediarios." />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Tiendly" />
	<meta property="og:title" content="Tiendly | Tu tienda online, sin intermediarios" />
	<meta property="og:description" content="Crea tu tienda online gratis, agrega productos y compártela por WhatsApp. Pedidos directos, sin comisiones ni intermediarios." />
	<meta property="og:url" content={SITE_URL + $page.url.pathname} />
	<meta property="og:locale" content="es_ES" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<ScrollToTop />
<OfflineBanner />
<Analytics />
<ConsentBanner />
<main class="min-h-[calc(100vh-4rem)]">
	{@render children()}
</main>