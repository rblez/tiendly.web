<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { supabase } from '$lib/supabase/client';

	type State = 'success' | 'warning' | 'error';
	type Service = { name: string; state: State; latency: number | null; message: string };
	let overallState = $state<State>('warning');
	let expanded = $state(false);
	let copied = $state(false);
	let checkedAt = $state<Date | null>(null);
	let cacheValue = $state<number | null>(null);
	let services = $state<Service[]>([
		{ name: 'Base de datos', state: 'warning', latency: null, message: 'Comprobando…' },
		{ name: 'Autenticación', state: 'warning', latency: null, message: 'Comprobando…' },
		{ name: 'Almacenamiento', state: 'warning', latency: null, message: 'Comprobando…' }
	]);
	let sessionId = $state('');
	let transferred = $state(0);
	const build = env.PUBLIC_APP_VERSION || 'v0.0.41';
	const config = {
		success: { icon: 'ri-check-line', label: 'Operativo', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30' },
		warning: { icon: 'ri-alert-line', label: 'Advertencia', color: 'text-amber-300 bg-amber-500/15 border-amber-400/30' },
		error: { icon: 'ri-close-circle-line', label: 'Error', color: 'text-red-300 bg-red-500/15 border-red-400/30' }
	} as const;

	function browser() { const ua = navigator.userAgent; return ua.includes('Edg') ? 'Edge' : ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Navegador'; }
	function os() { const ua = navigator.userAgent; return ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Android') ? 'Android' : ua.includes('Linux') ? 'Linux' : 'Sistema operativo'; }
	async function measureCache() {
		try {
			if (!('caches' in window)) return (cacheValue = null);
			let bytes = 0;
			for (const key of await caches.keys()) {
				const cache = await caches.open(key);
				for (const request of await cache.keys()) { const response = await cache.match(request); if (response) bytes += Number(response.headers.get('content-length')) || (await response.clone().blob()).size; }
			}
			cacheValue = bytes / 1048576;
		} catch { cacheValue = null; }
	}
	function report() {
		const server = services.map((service) => `${service.name}: ${config[service.state].label} · ${service.latency ?? 'n/d'} ms${service.state === 'error' ? ` · ${service.message}` : ''}`).join('\n');
		return `Tiendly — diagnóstico ${sessionId}\n\nServidor\n${server}\n\nCliente\nNavegador: ${browser()}\nSistema operativo: ${os()}\nBuild: ${build}\nCaché usada: ${cacheValue === null ? 'No disponible' : cacheValue.toFixed(2) + ' MB'}\nDatos transferidos: ${transferred.toFixed(1)} KB\nChequeo: ${checkedAt?.toLocaleString('es-CU') ?? 'n/d'}`;
	}
	async function checkDatabase(): Promise<Service> {
		const start = performance.now(); const result = await supabase.from('stores').select('id', { head: true, count: 'exact' }).limit(1); const latency = Math.round(performance.now() - start);
		return { name: 'Base de datos', state: result.error ? 'error' : latency > 1000 ? 'warning' : 'success', latency, message: result.error?.message ?? 'Respuesta correcta' };
	}
	async function checkAuth(): Promise<Service> {
		const start = performance.now(); const result = await supabase.auth.getUser(); const latency = Math.round(performance.now() - start);
		return { name: 'Autenticación', state: result.error && result.error.message !== 'Auth session missing!' ? 'error' : latency > 1000 ? 'warning' : 'success', latency, message: result.error?.message ?? 'Validación remota correcta' };
	}
	async function checkStorage(): Promise<Service> {
		const start = performance.now(); const result = await supabase.storage.from('media').list('', { limit: 1 }); const latency = Math.round(performance.now() - start);
		return { name: 'Almacenamiento', state: result.error ? 'error' : latency > 1000 ? 'warning' : 'success', latency, message: result.error?.message ?? 'Bucket media accesible' };
	}
	async function check() {
		const results = await Promise.all([checkDatabase(), checkAuth(), checkStorage()]);
		services = results;
		overallState = results.some((service) => service.state === 'error') ? 'error' : results.some((service) => service.state === 'warning') ? 'warning' : 'success';
		checkedAt = new Date();
		const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
		transferred = resources.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0) / 1024;
		await measureCache();
	}
	async function copy() { await navigator.clipboard.writeText(report()); copied = true; setTimeout(() => (copied = false), 1600); }
	onMount(() => { sessionId = crypto.randomUUID().slice(0, 8).toUpperCase(); check(); const timer = setInterval(check, 30000); return () => clearInterval(timer); });
</script>

<div class="relative z-10 flex items-center justify-center">
	<button type="button" class={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${config[overallState].color}`} onclick={(event) => { event.stopPropagation(); expanded = !expanded; }} aria-expanded={expanded}><i class={config[overallState].icon} aria-hidden="true"></i><span class="hidden sm:inline">{config[overallState].label}</span>{#if services[0].latency !== null}<span class="font-mono text-[10px] opacity-75">{services[0].latency}ms</span>{/if}</button>
	{#if expanded}
		<div class="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16 backdrop-blur-md sm:items-center sm:pt-4" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) expanded = false; }}>
			<div class="relative z-[10000] my-auto w-full max-w-sm shrink-0 rounded-2xl border border-hairline bg-card p-4 text-left shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="diagnostic-title">
				<div class="mb-3 flex items-center justify-between"><h2 id="diagnostic-title" class="text-sm font-semibold text-ink">Diagnóstico de servicio</h2><button type="button" class="text-muted" onclick={() => (expanded = false)} aria-label="Cerrar"><i class="ri-close-line"></i></button></div>
				<h3 class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Servidor</h3>
				{#each services as service (service.name)}<div class="flex items-center justify-between border-b border-hairline py-2 text-xs"><span class="text-body">{service.name}</span><span class={config[service.state].color + ' rounded-full border px-2 py-0.5'}>{config[service.state].label} · {service.latency ?? 'n/d'} ms</span></div>{/each}
				<h3 class="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Cliente</h3><div class="space-y-1 text-xs text-body"><p>Navegador: {browser()}</p><p>Sistema: {os()}</p><p>Build: {build}</p><p>Caché usada: {cacheValue === null ? 'No disponible' : `${cacheValue.toFixed(2)} MB`}</p><p>Transferidos: {transferred.toFixed(1)} KB</p><p>Sesión: {sessionId}</p><p>Chequeo: {checkedAt?.toLocaleTimeString('es-CU') ?? 'n/d'}</p></div>
				<button type="button" class="btn btn-secondary btn-sm mt-4 flex w-full items-center justify-center gap-2" onclick={copy}><i class={copied ? 'ri-check-line' : 'ri-file-copy-line'}></i>{copied ? 'Copiado' : 'Copiar diagnóstico'}</button>
			</div>
		</div>
	{/if}
</div>
