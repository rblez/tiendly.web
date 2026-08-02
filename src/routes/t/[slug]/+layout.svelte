<script lang="ts">
	import { onMount } from 'svelte';
	import StoreNavbar from '$lib/components/StoreNavbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import TiendlyNotch from '$lib/components/TiendlyNotch.svelte';
	import { supabase } from '$lib/supabase/client';
	import { themeStyle } from '$lib/utils';
	import type { Store } from '$lib/types';

	let { children, data }: { children: import('svelte').Snippet; data: { store: Store } } = $props();

	let store = $state(data.store);

	onMount(() => {
		const channel = supabase
			.channel(`store-layout-${data.store.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'stores', filter: `id=eq.${data.store.id}` },
				(payload) => {
					if (payload.new && typeof payload.new === 'object') store = payload.new as Store;
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	});
</script>

<svelte:head>
	<title>{store.name} | Tiendly</title>
	<meta name="description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
</svelte:head>

<div style={themeStyle(store)}>
	<StoreNavbar store={store} />
	<main class="min-h-[calc(100vh-4rem)]">
		{@render children()}
	</main>
	<Footer {store} />
	<TiendlyNotch />
</div>
