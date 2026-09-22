<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { toast, type ToastItem, type ToastType } from '$lib/stores/toast.svelte';

	const icons: Record<ToastType, string> = {
		error: 'ri-error-warning-line',
		warning: 'ri-alert-line',
		success: 'ri-checkbox-circle-line',
		info: 'ri-information-line',
	};

	const labels: Record<ToastType, string> = {
		error: 'Error',
		warning: 'Aviso',
		success: 'Listo',
		info: 'Información',
	};

	let timers = new SvelteMap<number, ReturnType<typeof setTimeout>>();

	function schedule(item: ToastItem) {
		if (timers.has(item.id)) return;
		timers.set(item.id, setTimeout(() => {
			timers.delete(item.id);
			toast.dismiss(item.id);
		}, item.duration));
	}

	function dismiss(id: number) {
		const timer = timers.get(id);
		if (timer) clearTimeout(timer);
		timers.delete(id);
		toast.dismiss(id);
	}

	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			if (event.error) toast.error(event.error);
			else if (event.message) toast.error(event.message);
		};
		const handleRejection = (event: PromiseRejectionEvent) => toast.error(event.reason);
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);
		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
			timers.forEach((timer) => clearTimeout(timer));
		};
	});
</script>

<div class="pointer-events-none fixed inset-x-4 bottom-4 z-[9999] flex flex-col gap-3 sm:left-auto sm:right-5 sm:inset-x-auto sm:bottom-5 sm:w-[min(24rem,calc(100vw-2.5rem))]" aria-live="polite" aria-atomic="false">
	{#each toast.items as item (item.id)}
		{@const _ = schedule(item)}
		<div class="pointer-events-auto flex items-start gap-3 rounded-2xl border border-hairline bg-card px-4 py-3 text-sm text-ink shadow-2xl animate-[toast-in_180ms_ease-out]" role={item.type === 'error' ? 'alert' : 'status'}>
			<i class={`${icons[item.type]} mt-0.5 shrink-0 text-lg ${item.type === 'error' ? 'text-error' : item.type === 'warning' ? 'text-warning' : item.type === 'success' ? 'text-success' : 'text-ember'}`} aria-hidden="true"></i>
			<div class="min-w-0 flex-1"><p class="font-semibold">{labels[item.type]}</p><p class="mt-0.5 break-words text-muted">{item.message}</p></div>
			<button type="button" class="shrink-0 rounded-lg p-1 text-muted hover:bg-canvas-soft hover:text-ink" aria-label="Cerrar aviso" onclick={() => dismiss(item.id)}><i class="ri-close-line" aria-hidden="true"></i></button>
		</div>
	{/each}
</div>

<style>
	@keyframes toast-in { from { opacity: 0; transform: translateY(0.75rem); } to { opacity: 1; transform: translateY(0); } }
</style>
