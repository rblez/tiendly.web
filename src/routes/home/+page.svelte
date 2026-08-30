<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Landing from '$lib/components/Landing.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	$effect(() => {
		auth.init();
	});
</script>

<svelte:head>
	<title>Tu panel | Tiendly</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<MarketingNav />
<Landing />
<Footer />
