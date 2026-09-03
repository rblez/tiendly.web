<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	let { children } = $props();
	let storeCode = $derived(page.params.code ?? '');
	let isSettingsSubpage = $derived(page.url.pathname.includes('/configuracion/'));

	$effect(() => {
		auth.init();
		if (auth.ready && !auth.session) {
			goto('/login');
		}
	});
</script>

{#if auth.ready && auth.session}
	<div class="flex flex-col min-h-screen" data-panel>
		{#if storeCode && !isSettingsSubpage}
			<header class="sticky top-0 z-40 border-b border-hairline acrylic">
				<div class="border-b border-ember/15 bg-ember/10">
					<div class="mx-auto flex min-h-11 max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
						<p class="text-xs font-medium leading-5 text-body sm:text-sm">
							<span class="font-bold text-ember">Tiendly está en beta.</span>
							<span class="hidden sm:inline"> Déjanos comentarios, reportes y sugerencias para seguir mejorando.</span>
							<span class="sm:hidden"> Déjanos comentarios y sugerencias.</span>
						</p>
					</div>
				</div>
				<div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
					<a href={`/dashboard/s/${storeCode}/configuracion/cuenta`} class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-bone text-body transition-colors hover:text-ember" aria-label="Abrir cuenta">
						{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Cuenta" class="h-full w-full rounded-full object-cover" />{:else}<i class="ri-user-line" style="font-size: 18px" aria-hidden="true"></i>{/if}
					</a>
					<div class="flex items-center gap-2">
					<a href={`/dashboard/s/${storeCode}/configuracion/cuenta/notificaciones`} class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-bone text-body transition-colors hover:text-ember" aria-label="Abrir notificaciones" title="Notificaciones">
						<i class="ri-notification-3-line" style="font-size: 18px" aria-hidden="true"></i>
					</a>
					<span class="rounded-full border border-ember/20 bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">{auth.plan === 'free' ? 'Gratis' : auth.plan}</span>
					</div>
				</div>
			</header>
		{/if}
		<div class:flex-1={!isSettingsSubpage} class="{isSettingsSubpage ? 'flex-1' : 'flex-1 pb-24 lg:pb-0'}">
			{@render children()}
		</div>
		{#if storeCode && !isSettingsSubpage}
			{@const seg = page.url.pathname.split('/').filter(Boolean).pop() ?? ''}
			<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 acrylic border-t border-hairline shadow-2xl px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] grid grid-cols-4 gap-1" aria-label="Navegación de la tienda">
				<a href={`/dashboard/s/${storeCode}`} class:active-nav={seg === storeCode || seg === 'resumen' || seg === 'inicio' || seg === 'estadisticas'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-home-5-line" style="font-size: 24px" aria-hidden="true"></i><span class="hidden sm:inline">Inicio</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/productos`} class:active-nav={seg === 'productos' || seg === 'cupones'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-box-3-line" style="font-size: 24px" aria-hidden="true"></i><span class="hidden sm:inline">Productos</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/pedidos`} class:active-nav={seg === 'pedidos'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-file-list-3-line" style="font-size: 24px" aria-hidden="true"></i><span class="hidden sm:inline">Pedidos</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/configuracion`} class:active-nav={page.url.pathname.includes('/configuracion')} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class="ri-settings-3-line" style="font-size: 24px" aria-hidden="true"></i><span class="hidden sm:inline">Ajustes</span>
				</a>
			</nav>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-32">
		<i class="ri-loader-4-line animate-spin text-ember" style="font-size: 24px" aria-label="Cargando"></i>
	</div>
{/if}

<style>
	.active-nav {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
	}
</style>
