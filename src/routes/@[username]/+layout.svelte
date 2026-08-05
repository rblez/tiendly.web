<script lang="ts">
	import { onMount } from 'svelte';
	import StoreNavbar from '$lib/components/StoreNavbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { supabase } from '$lib/supabase/client';
	import { themeStyle } from '$lib/utils';
	import type { Store } from '$lib/types';

	let { children, data }: { children: import('svelte').Snippet; data: { store: Store } } = $props();

	let store = $state(data.store);

	$effect(() => {
		try {
			const key = `tiendly-visited-${store.slug}`;
			if (sessionStorage.getItem(key)) return;
			sessionStorage.setItem(key, '1');
			fetch(`/api/track-visit/${store.slug}`, { method: 'POST' }).catch(() => {});
		} catch {
			// privado: no se registra la visita
		}
	});

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

	const storeUrl = $derived(`https://www.tiendly.lat/@${store.slug}`);
	const logoUrl = $derived.by(() => {
		if (!store.logo) return null;
		if (store.logo.startsWith('http')) return store.logo;
		return `https://www.tiendly.lat/${store.logo.replace(/^\//, '')}`;
	});

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Store',
			name: store.name,
			description: store.description ?? undefined,
			url: storeUrl,
			logo: logoUrl ?? undefined,
			...(store.whatsapp ? { contactPoint: { '@type': 'ContactPoint', telephone: `+${store.whatsapp}`, contactType: 'sales' } } : {}),
		}),
	);
</script>

<svelte:head>
	<title>{store.name} | Tiendly</title>
	<meta name="description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={`${store.name} | Tiendly`} />
	<meta property="og:description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
	<meta property="og:url" content={storeUrl} />
	<meta property="og:site_name" content="Tiendly" />
	{#if logoUrl}
		<meta property="og:image" content={logoUrl} />
	{/if}
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={`${store.name} | Tiendly`} />
	<meta name="twitter:description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
	{#if logoUrl}
		<meta name="twitter:image" content={logoUrl} />
	{/if}
	<script type="application/ld+json">{jsonLd}</script>
</svelte:head>

<div style={themeStyle(store)}>
	<StoreNavbar store={store} />
	<main class="min-h-[calc(100vh-4rem)]">
		{@render children()}
	</main>
	<Footer {store} />
</div>
