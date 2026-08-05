<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import { theme } from '$lib/stores/theme.svelte';

	let { children } = $props();

	$effect(() => {
		theme.init();
		const tr = $page.url.searchParams.get('theme_refresh');
		if (tr === '1' || tr === '2' || tr === 'auto') {
			theme.set(tr === '1' ? 'dark' : tr === '2' ? 'light' : 'auto');
			const url = new URL($page.url.href);
			url.searchParams.delete('theme_refresh');
			history.replaceState(history.state, '', url);
		}
	});
</script>

<svelte:head>
	<title>Tiendly | Tu tienda online en 5 minutos</title>
	<meta name="description" content="Crea tu tienda online gratis, agrega productos y compártela por WhatsApp en menos de 5 minutos." />
</svelte:head>

<ScrollToTop />
<OfflineBanner />
<main class="min-h-[calc(100vh-4rem)]">
	{@render children()}
</main>
