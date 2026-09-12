<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';

	type Status = 'success' | 'warning' | 'error';

	let status = $state<Status>('warning');
	let latency = $state<number | null>(null);
	let checkedAt = $state<Date | null>(null);
	let message = $state('Comprobando conexión con Supabase…');
	let service = $state('Auth y base de datos');
	let expanded = $state(false);
	let copied = $state(false);

	const statusConfig = {
		success: { label: 'Operativo', icon: 'ri-check-line', className: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' },
		warning: { label: 'Advertencia', icon: 'ri-alert-line', className: 'border-amber-400/30 bg-amber-500/15 text-amber-300' },
		error: { label: 'Error', icon: 'ri-close-circle-line', className: 'border-red-400/30 bg-red-500/15 text-red-300' },
	} as const;

	async function checkHealth() {
		const startedAt = performance.now();
		try {
			const { error } = await supabase.from('stores').select('id', { head: true, count: 'exact' }).limit(1);
			const measuredLatency = Math.round(performance.now() - startedAt);
			latency = measuredLatency;
			checkedAt = new Date();
			service = 'Base de datos y sesión';
			if (error) throw error;
			if (measuredLatency > 1500) {
				status = 'warning';
				message = 'La conexión responde, pero con latencia alta.';
			} else {
				status = 'success';
				message = 'La conexión con Supabase funciona correctamente.';
			}
		} catch (error) {
			status = 'error';
			latency = Math.round(performance.now() - startedAt);
			checkedAt = new Date();
			service = 'Base de datos y sesión';
			message = error instanceof Error ? error.message : 'No se pudo comprobar el servicio.';
		}
	}

	function detailText() {
		const checked = checkedAt ? checkedAt.toLocaleString('es-CU') : 'sin comprobar';
		return `Tiendly — estado de Supabase\nEstado: ${statusConfig[status].label}\nServicio: ${service}\nLatencia: ${latency === null ? 'n/d' : `${latency} ms`}\nHora: ${checked}\nDetalle: ${message}`;
	}

	async function copyDetails() {
		await navigator.clipboard.writeText(detailText());
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}

	onMount(() => {
		checkHealth();
		const interval = window.setInterval(checkHealth, 30000);
		return () => window.clearInterval(interval);
	});
</script>

<div class="relative z-10 flex items-center justify-center">
	<button type="button" class={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${statusConfig[status].className}`} onclick={() => (expanded = !expanded)} aria-expanded={expanded} aria-label={`Estado de Supabase: ${statusConfig[status].label}`}>
		<i class={`${statusConfig[status].icon} text-sm`} aria-hidden="true"></i>
		<span class="hidden sm:inline">{statusConfig[status].label}</span>
		{#if latency !== null}<span class="font-mono text-[10px] opacity-75">{latency}ms</span>{/if}
	</button>
	{#if expanded}
		<div class="absolute left-1/2 top-[calc(100%+0.65rem)] w-72 -translate-x-1/2 rounded-2xl border border-hairline bg-card p-4 text-left shadow-2xl">
			<div class="mb-3 flex items-start justify-between gap-3">
				<div><p class="text-sm font-semibold text-ink">Estado de servicios</p><p class="mt-0.5 text-xs text-muted">{service}</p></div>
				<button type="button" class="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-bone hover:text-ink" onclick={() => (expanded = false)} aria-label="Cerrar detalle"><i class="ri-close-line" aria-hidden="true"></i></button>
			</div>
			<p class="rounded-xl bg-bone px-3 py-2 text-xs leading-relaxed text-body">{message}</p>
			<div class="mt-3 grid grid-cols-2 gap-2 text-xs text-muted"><span>Latencia <strong class="text-ink">{latency === null ? 'n/d' : `${latency} ms`}</strong></span><span class="text-right">{checkedAt ? checkedAt.toLocaleTimeString('es-CU') : '—'}</span></div>
			<button type="button" class="btn btn-secondary btn-sm mt-4 flex w-full items-center justify-center gap-2" onclick={copyDetails}><i class={copied ? 'ri-check-line' : 'ri-file-copy-line'} aria-hidden="true"></i>{copied ? 'Copiado' : 'Copiar detalle'}</button>
		</div>
	{/if}
</div>

<style>
	:global(.status-notch) { isolation: isolate; }
</style>
