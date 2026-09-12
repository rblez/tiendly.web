<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';

	let storage = $state(0);
	let cache = $state(0);
	let images = $state(0);
	let transferred = $state(0);
	let quota = $state(0);
	let loading = $state(true);
	let unavailable = $state(false);

	const fallbackLimits = { cache: 50, storage: 25, images: 100 };
	const format = (value: number) => value >= 1024 ? `${(value / 1024).toFixed(2)} MB` : `${value.toFixed(1)} KB`;
	const usage = (value: number, limit: number) => Math.min(100, Math.round((value / Math.max(limit, 0.01)) * 100));
	const tone = (value: number, limit: number) => usage(value, limit) >= 90 ? 'bg-red-500' : usage(value, limit) >= 65 ? 'bg-amber-400' : 'bg-ember';

	async function cacheBytes() {
		if (!('caches' in window)) return { total: 0, image: 0 };
		let total = 0;
		let image = 0;
		for (const key of await caches.keys()) {
			const cacheStore = await caches.open(key);
			for (const request of await cacheStore.keys()) {
				const response = await cacheStore.match(request);
				if (!response) continue;
				const size = Number(response.headers.get('content-length')) || (await response.clone().blob()).size;
				total += size;
				if ((response.headers.get('content-type') ?? '').startsWith('image/')) image += size;
			}
		}
		return { total, image };
	}

	async function refresh() {
		loading = true;
		unavailable = false;
		try {
			const estimate = await navigator.storage?.estimate();
			const persistentUsage = estimate?.usage ?? 0;
			quota = estimate?.quota ?? 0;
			const cached = await cacheBytes();
			cache = cached.total / 1048576;
			images = cached.image / 1048576;
			storage = Math.max(0, (persistentUsage - cached.total) / 1048576);
			const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
			transferred = resources.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0) / 1024;
		} catch {
			unavailable = true;
		}
		loading = false;
	}

	function clearLocal() {
		localStorage.clear();
		indexedDB?.databases?.().then((databases) => Promise.all(databases.map((database) => database.name ? new Promise<void>((resolve) => { const request = indexedDB.deleteDatabase(database.name!); request.onsuccess = request.onerror = request.onblocked = () => resolve(); }) : Promise.resolve()))).finally(refresh);
	}

	async function clearCache() {
		if ('caches' in window) await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
		await refresh();
	}

	async function clearAll() {
		clearLocal();
		await clearCache();
		transferred = 0;
	}

	onMount(() => { refresh(); });
</script>

<svelte:head><title>Rendimiento | Ajustes | Tiendly</title></svelte:head>
<div class="mx-auto min-h-full max-w-2xl px-4 pb-28 pt-7 sm:px-6">
	<SettingsHeader title="Rendimiento" backHref={`/dashboard/s/${$page.params.code}/configuracion`} />
	<p class="mb-6 mt-2 text-sm text-muted">Uso real de almacenamiento persistente y transferencia de esta sesión.</p>
	{#if unavailable}<p class="mb-4 rounded-btn border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-xs text-amber-300">Algunas métricas no están disponibles en este navegador.</p>{/if}
	<div class="space-y-4">
		{#each [{ label: 'Caché de la app', value: cache, limit: fallbackLimits.cache, action: clearCache }, { label: 'Almacenamiento local', value: storage, limit: quota ? quota / 1048576 : fallbackLimits.storage, action: clearLocal }, { label: 'Imágenes en caché', value: images, limit: fallbackLimits.images, action: clearCache }] as item (item.label)}
			<section class="rounded-card border border-hairline bg-card p-4"><div class="flex items-center justify-between gap-3"><h2 class="text-sm font-semibold text-ink">{item.label}</h2><span class="text-xs text-muted">{loading ? 'Calculando…' : `${item.value.toFixed(2)} / ${item.limit.toFixed(0)} MB`}</span></div><div class="mt-3 h-2 overflow-hidden rounded-full bg-bone"><div class={`h-full rounded-full transition-all ${tone(item.value, item.limit)}`} style={`width:${usage(item.value, item.limit)}%`}></div></div><button type="button" class="mt-3 text-xs font-semibold text-ember hover:underline" onclick={item.action}>Limpiar</button></section>
		{/each}
		<section class="rounded-card border border-hairline bg-card p-4"><div class="flex items-center justify-between"><h2 class="text-sm font-semibold text-ink">Datos transferidos hoy</h2><span class="text-sm font-semibold text-ink">{loading ? 'Calculando…' : format(transferred)}</span></div><p class="mt-1 text-xs text-muted">Medición de los recursos cargados en esta sesión.</p></section>
	</div>
	<button type="button" class="mt-6 flex w-full items-center justify-center gap-2 rounded-card border border-error/20 bg-error/5 px-4 py-4 text-sm font-semibold text-error hover:bg-error/10" onclick={clearAll}><i class="ri-delete-bin-line"></i>Limpiar todo</button>
</div>
