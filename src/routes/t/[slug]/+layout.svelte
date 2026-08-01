<script lang="ts">
	import StoreNavbar from '$lib/components/StoreNavbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { themeStyle } from '$lib/utils';
	import type { Store } from '$lib/types';

	let { children, data }: { children: import('svelte').Snippet; data: { store: Store } } = $props();
</script>

<svelte:head>
	<title>{data.store.name} | Tiendly</title>
	<meta name="description" content={data.store.description ?? `Compra en ${data.store.name} con Tiendly.`} />
</svelte:head>

<div style={themeStyle(data.store)}>
	<StoreNavbar store={data.store} />
	<main class="min-h-[calc(100vh-4rem)]">
		{@render children()}
	</main>
	<Footer />
</div>
