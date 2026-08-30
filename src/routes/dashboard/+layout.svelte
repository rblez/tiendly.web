<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();
	let storeCode = $derived(page.params.code ?? '');

	$effect(() => {
		auth.init();
		if (auth.ready && !auth.session) {
			goto('/login');
		}
	});
</script>

{#if auth.ready && auth.session}
	<div class="flex flex-col min-h-screen">
		<header class="sticky top-0 z-40 border-b border-hairline acrylic">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
				<a href={storeCode ? `/dashboard/s/${storeCode}/configuracion` : '/dashboard'} class="h-9 w-9 rounded-full bg-bone border border-hairline flex items-center justify-center text-body hover:text-ember transition-colors no-underline shrink-0" aria-label="Configuración">
					<i class="ri-settings-3-line" aria-hidden="true"></i>
				</a>
				<a href="/dashboard" class="px-3 py-2 rounded-btn text-sm font-medium text-body hover:bg-bone hover:text-ink transition-colors no-underline flex items-center gap-2">
					<i class="ri-home-line" aria-hidden="true"></i>
					<span>Inicio</span>
				</a>
			</div>
		</header>
		<div class="flex-1 pb-24 lg:pb-0">
			{@render children()}
		</div>
		{#if storeCode}
			{@const seg = page.url.pathname.split('/').filter(Boolean).pop() ?? ''}
			<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 acrylic border-t border-hairline shadow-2xl px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] grid grid-cols-4 gap-1" aria-label="Navegación de la tienda">
				<a href={`/dashboard/s/${storeCode}`} class:active-nav={seg === storeCode || seg === 'resumen' || seg === 'inicio' || seg === 'estadisticas'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-bar-chart-line text-lg"></i><span>Estadísticas</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/productos`} class:active-nav={seg === 'productos' || seg === 'cupones'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-box-3-line text-lg"></i><span>Productos</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/pedidos`} class:active-nav={seg === 'pedidos'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-folders-line text-lg"></i><span>Pedidos</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/configuracion`} class:active-nav={page.url.pathname.includes('/configuracion')} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-settings-3-line text-lg"></i><span>Ajustes</span>
				</a>
			</nav>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-32">
		<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
	</div>
{/if}

<style>
	.active-nav {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
	}
</style>
