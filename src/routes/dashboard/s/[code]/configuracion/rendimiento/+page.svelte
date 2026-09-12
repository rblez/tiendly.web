<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	let storage = $state(0); let images = $state(0); let cache = $state(0); let transferred = $state(0);
	const limits = { cache: 50, storage: 25, images: 100 };
	function usage(value: number, limit: number) { return Math.min(100, Math.round((value / limit) * 100)); }
	function tone(value: number, limit: number) { const percent = usage(value, limit); return percent >= 90 ? 'bg-red-500' : percent >= 65 ? 'bg-amber-400' : 'bg-ember'; }
	function refresh() { storage = Number((JSON.stringify(localStorage).length / 1048576).toFixed(2)); cache = caches ? 0 : 0; images = 0; }
	function clearLocal() { localStorage.clear(); storage = 0; }
	async function clearCache() { if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map((key) => caches.delete(key))); } cache = 0; images = 0; }
	async function clearAll() { clearLocal(); await clearCache(); transferred = 0; }
	onMount(() => { refresh(); });
</script>
<svelte:head><title>Rendimiento | Ajustes | Tiendly</title></svelte:head>
<div class="mx-auto min-h-full max-w-2xl px-4 pb-28 pt-7 sm:px-6">
	<SettingsHeader title="Rendimiento" backHref={`/dashboard/s/${$page.params.code}/configuracion`} />
	<p class="mb-6 mt-2 text-sm text-muted">Consulta y limpia el almacenamiento local de la app.</p>
	<div class="space-y-4">
		{#each [{ label: 'Caché de la app', value: cache, limit: limits.cache, action: clearCache }, { label: 'Almacenamiento local', value: storage, limit: limits.storage, action: clearLocal }, { label: 'Imágenes en caché', value: images, limit: limits.images, action: clearCache }] as item (item.label)}
			<section class="rounded-card border border-hairline bg-card p-4"><div class="flex items-center justify-between gap-3"><h2 class="text-sm font-semibold text-ink">{item.label}</h2><span class="text-xs text-muted">{item.value.toFixed(2)} / {item.limit} MB</span></div><div class="mt-3 h-2 overflow-hidden rounded-full bg-bone"><div class={`h-full rounded-full transition-all ${tone(item.value, item.limit)}`} style={`width:${usage(item.value, item.limit)}%`}></div></div><button type="button" class="mt-3 text-xs font-semibold text-ember hover:underline" onclick={item.action}>Limpiar</button></section>
		{/each}
		<section class="rounded-card border border-hairline bg-card p-4"><div class="flex items-center justify-between"><h2 class="text-sm font-semibold text-ink">Datos transferidos hoy</h2><span class="text-sm font-semibold text-ink">{transferred.toFixed(1)} KB</span></div><p class="mt-1 text-xs text-muted">Medición de la sesión actual.</p></section>
	</div>
	<button type="button" class="mt-6 flex w-full items-center justify-center gap-2 rounded-card border border-error/20 bg-error/5 px-4 py-4 text-sm font-semibold text-error hover:bg-error/10" onclick={clearAll}><i class="ri-delete-bin-line"></i>Limpiar todo</button>
</div>
