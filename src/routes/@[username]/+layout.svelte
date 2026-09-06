<script lang="ts">
	import { page } from '$app/stores';
	import StoreNavbar from '$lib/components/StoreNavbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CreateStoreToast from '$lib/components/CreateStoreToast.svelte';
	import TrackOrderModal from '$lib/components/TrackOrderModal.svelte';
	import { supabase } from '$lib/supabase/client';
	import { env as publicEnv } from '$env/dynamic/public';
const PUBLIC_SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL ?? '';
	import { cart } from '$lib/stores/cart.svelte';
	import { currency } from '$lib/stores/currency.svelte';
	import { SITE_URL, getUtmFromUrl, saveUtm, themeStyle, storeUrl as buildStoreUrl, utmQuery } from '$lib/utils';
	import type { Store } from '$lib/types';

	let { children, data }: {
		children: import('svelte').Snippet;
		data: { store: Store; ownerPlan: string | null };
	} = $props();

	// svelte-ignore state_referenced_locally
	let store = $state(data.store);
	// svelte-ignore state_referenced_locally
	const PREVIEW_TOTAL = 600;


	$effect(() => {
		store = data.store;
		previewToken = data.preview?.token ?? null;
		secondsLeft = 0;
		previewExpired = false;
	});

	$effect(() => {
		cart.init();
		currency.init();
	});

	$effect(() => {
		const storeId = data.store.id;
		const channel = supabase
			.channel(`store-layout-${storeId}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'stores', filter: `id=eq.${storeId}` },
				(payload) => {
					if (payload.new && typeof payload.new === 'object') store = payload.new as Store;
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	});

	$effect(() => {
		const expiresAt = data.preview?.expiresAt;
		if (!expiresAt) return;
		const update = () => {
			const left = new Date(expiresAt).getTime() - Date.now();
			secondsLeft = Math.max(0, Math.round(left / 1000));
			if (left <= 0) previewExpired = true;
		};
		update();
		const t = setInterval(update, 1000);
		return () => clearInterval(t);
	});


	$effect(() => {
		try {
			const key = `tiendly-visited-${store.slug}`;
			if (sessionStorage.getItem(key)) return;
			sessionStorage.setItem(key, '1');
			const utm = getUtmFromUrl($page.url);
			saveUtm(utm);
			const qs = utmQuery(utm);
			fetch(`/api/track-visit/${store.slug}${qs ? `?${qs}` : ''}`, { method: 'POST' }).catch(() => {});
			const recentKey = 'tiendly-recent-stores';
			const recents = JSON.parse(localStorage.getItem(recentKey) ?? '[]') as Array<{ slug: string; name: string; logo: string | null }>;
			const next = [{ slug: data.store.slug, name: data.store.name, logo: data.store.logo }, ...recents.filter((r) => r.slug !== data.store.slug)].slice(0, 6);
			localStorage.setItem(recentKey, JSON.stringify(next));
		} catch {
			// privado: no se registra la visita
		}
	});

	const storeUrl = $derived(buildStoreUrl(store.slug));
	const breadcrumbLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Tiendly', item: SITE_URL },
				{ '@type': 'ListItem', position: 2, name: store.name, item: storeUrl },
			],
		}),
	);
	const logoUrl = $derived.by(() => {
		if (!store.logo) return null;
		if (store.logo.startsWith('http')) return store.logo;
		return `${SITE_URL}/${store.logo.replace(/^\//, '')}`;
	});

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Store',
			name: store.name,
			description: store.description ?? undefined,
			url: storeUrl,
			...(store.logo ? { logo: logoUrl } : {}),
		}),
	);

	let favicon = $state<string | null>(null);

	let trackModalOpen = $state(false);
	let trackCode = $state('');

	$effect(() => {
		const code = $page.url.searchParams.get('track_order');
		if (!code) return;
		trackCode = code;
		trackModalOpen = true;
		const url = new URL($page.url);
		url.searchParams.delete('track_order');
		history.replaceState(null, '', url.pathname + url.search);
	});

	function openTrack(code: string) {
		trackCode = code;
		trackModalOpen = true;
	}

	async function buildFavicon(logo: string | null, name: string, accent: string): Promise<string> {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;
		const ctx = canvas.getContext('2d');
		if (!ctx) return '';
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
			.catch(() => (favicon = ''));
	});
</script>

<svelte:head>
	<title>{store.name} | Tiendly</title>
	<link rel="preconnect" href={`https://${new URL(PUBLIC_SUPABASE_URL).host}`} crossorigin="anonymous" />
	<link rel="icon" type="image/png" href={favicon ?? ''} />
	<meta name="description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={`${store.name} | Tiendly`} />
	<meta property="og:description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
	<meta property="og:url" content={storeUrl} />
	<link rel="canonical" href={storeUrl} />
	<meta property="og:site_name" content="Tiendly" />
	<meta property="og:locale" content="es_ES" />
	{#if logoUrl}
		<meta property="og:image" content={logoUrl} />
		<meta name="twitter:image" content={logoUrl} />
	{/if}
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={`${store.name} | Tiendly`} />
	<meta name="twitter:description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
	<script type="application/ld+json">{jsonLd}</script>
	<script type="application/ld+json">{breadcrumbLd}</script>
</svelte:head>

<div style={themeStyle(store)}>
	<StoreNavbar store={store} />
	<main class="min-h-[calc(100vh-4rem)]">
		{@render children()}
	</main>
	<Footer {store} onTrackOrder={openTrack} />
	{#if !previewToken && (data.ownerPlan === 'free' || data.ownerPlan === 'creator')}
		<CreateStoreToast />
	{/if}
	{#if trackModalOpen}
		<TrackOrderModal {store} initialCode={trackCode} onClose={() => (trackModalOpen = false)} />
	{/if}
</div>
