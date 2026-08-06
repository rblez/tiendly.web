<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import StoreNavbar from '$lib/components/StoreNavbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CreateStoreToast from '$lib/components/CreateStoreToast.svelte';
	import { supabase } from '$lib/supabase/client';
	import { SITE_URL, getUtmFromUrl, loadUtm, saveUtm, themeStyle, storeUrl as buildStoreUrl, utmQuery } from '$lib/utils';
	import type { Store } from '$lib/types';

	let { children, data }: {
		children: import('svelte').Snippet;
		data: { store: Store; ownerPlan: string | null; preview: { token: string; expiresAt: string | null } | null };
	} = $props();

	let store = $state(data.store);
	let previewToken = $state(data.preview?.token ?? null);
	let secondsLeft = $state(0);
	let previewExpired = $state(false);

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

	const previewTime = $derived(`${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`);

	async function signInWithGoogle() {
		const qs = utmQuery(loadUtm());
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${location.origin}/signup?preview=${previewToken}&name=${encodeURIComponent(store.name)}${qs ? `&${qs}` : ''}`,
			},
		});
	}

	$effect(() => {
		try {
			const key = `tiendly-visited-${store.slug}`;
			if (sessionStorage.getItem(key)) return;
			sessionStorage.setItem(key, '1');
			const utm = getUtmFromUrl($page.url);
			saveUtm(utm);
			const qs = utmQuery(utm);
			fetch(`/api/track-visit/${store.slug}${qs ? `?${qs}` : ''}`, { method: 'POST' }).catch(() => {});
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
	{/if}
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={`${store.name} | Tiendly`} />
	<meta name="twitter:description" content={store.description ?? `Compra en ${store.name} con Tiendly.`} />
	{#if logoUrl}
		<meta name="twitter:image" content={logoUrl} />
	{/if}
	<script type="application/ld+json">{jsonLd}</script>
	<script type="application/ld+json">{breadcrumbLd}</script>
</svelte:head>

<div style={themeStyle(store)}>
	{#if previewToken}
		<div class="sticky top-0 z-50 px-4 py-2 text-white text-xs sm:text-sm font-medium flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5" style={`background:${store.theme_color}`}>
			{#if previewExpired}
				<span>La vista previa expiró y tu tienda se eliminó.</span>
				<a href="/wizard" class="underline underline-offset-2 font-bold no-underline">Crear tienda de nuevo</a>
			{:else}
				<span class="flex items-center gap-1.5">
					<i class="ri-eye-line"></i>
					Vista previa — se elimina en
					<span class="font-bold tabular-nums">{previewTime}</span>
				</span>
				<span class="hidden sm:inline text-white/80">Actívalla creando tu cuenta:</span>
				<div class="flex items-center gap-1.5">
					<button
						onclick={signInWithGoogle}
						class="inline-flex items-center bg-white text-ink px-3 py-1 rounded-full text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
					>
						<i class="ri-google-line mr-1"></i>
						Google
					</button>
					<a
						href={`/signup?preview=${previewToken}&name=${encodeURIComponent(store.name)}`}
						class="inline-flex items-center bg-white text-ink px-3 py-1 rounded-full text-xs font-bold hover:opacity-90 transition-opacity no-underline"
					>
						Correo
					</a>
				</div>
			{/if}
		</div>
	{/if}
	<StoreNavbar store={store} previewMode={!!previewToken} />
	<main class="min-h-[calc(100vh-4rem)]">
		{@render children()}
	</main>
	<Footer {store} ownerPlan={data.ownerPlan} />
	{#if !previewToken && (data.ownerPlan === 'free' || data.ownerPlan === 'creator')}
		<CreateStoreToast />
	{/if}
</div>
