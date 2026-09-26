<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Landing from '$lib/components/Landing.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { SITE_URL } from '$lib/utils';

	$effect(() => {
		auth.init();
	});
</script>

<Seo
	title="Tu panel | Tiendly"
	description="Tu inicio en Tiendly: accede a tu tienda, productos y pedidos."
	canonical={SITE_URL + '/home'}
	noindex
/>

<MarketingNav />
<Landing />
<Footer />
