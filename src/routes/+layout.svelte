<script lang="ts">
	import '../app.css';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';

	let { children } = $props();
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
