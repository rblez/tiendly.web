<script lang="ts">
	import { onMount } from 'svelte';
	import StoreNavbar from '$lib/components/StoreNavbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CreateStoreToast from '$lib/components/CreateStoreToast.svelte';
	import { supabase } from '$lib/supabase/client';
	import { SITE_URL, themeStyle, storeUrl as buildStoreUrl } from '$lib/utils';
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

	const storeUrl = $derived(buildStoreUrl(store.slug));
	const logoUrl = $derived.by(() => {
		if (!store.logo) return null;
		if (store.logo.startsWith('http')) return store.logo;
		return `${SITE_URL}/${store.logo.replace(/^\//, '')}`;
	});

	let favicon = $state<string | null>(null);

	async function buildFavicon(logo: string | null, name: string, accent: string): Promise<string> {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;
		const ctx = canvas.getContext('2d');
		if (!ctx) return '/isotipo.png';
		ctx.fillStyle = accent;
		const r = 14;
		ctx.beginPath();
		ctx.moveTo(r, 0);
		ctx.arcTo(64, 0, 64, 64, r);
		ctx.arcTo(64, 64, 0, 64, r);
		ctx.arcTo(0, 64, 0, 0, r);
		ctx.arcTo(0, 0, 64, 0, r);
		ctx.closePath();
		ctx.fill();
		if (logo) {
			try {
				const img = new Image();
				img.crossOrigin = 'anonymous';
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error('img'));
					img.src = logo;
				});
				const side = Math.min(img.naturalWidth, img.naturalHeight);
				ctx.beginPath();
				ctx.arc(32, 32, 24, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 8, 8, 48, 48);
				return canvas.toDataURL('image/png');
			} catch {
				// cae a la letra
			}
		}
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 40px system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(name.charAt(0).toUpperCase(), 32, 34);
		return canvas.toDataURL('image/png');
	}

	$effect(() => {
		const logo = store.logo ? (store.logo.startsWith('http') ? store.logo : `${SITE_URL}/${store.logo.replace(/^\//, '')}`) : null;
		buildFavicon(logo, store.name, store.theme_color)
			.then((url) => (favicon = url))
			.catch(() => (favicon = '/isotipo.png'));
	});
</script>

<svelte:head>
	<title>{store.name} | Tiendly</title>
	<link rel="icon" type="image/png" href={favicon ?? '/isotipo.png'} />
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
