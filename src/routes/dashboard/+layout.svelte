<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import SupabaseStatusNotch from '$lib/components/dashboard/SupabaseStatusNotch.svelte';
	let { children } = $props();
	let storeCode = $derived(page.params.code ?? '');
	let isSettingsSubpage = $derived(page.url.pathname.includes('/configuracion/'));

	$effect(() => {
		auth.init();
		if (auth.ready && !auth.session) {
			goto('/login');
		}
	});
	let showModal = $state(false);
	$effect(() => {
		const key = 'tg_modal_seen';
		if (!sessionStorage.getItem(key)) {
			setTimeout(() => { showModal = true; }, 2000);
			sessionStorage.setItem(key, '1');
		}
	});
</script>

{#if auth.ready && auth.session}
	<div class="flex flex-col min-h-screen" data-panel>
		{#if storeCode && !isSettingsSubpage}
			<header class="sticky top-0 z-40 border-b border-hairline bg-canvas/95 backdrop-blur-md">
				<div class="mx-auto grid h-16 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
					<div class="min-w-0">
						<a href={`/dashboard/s/${storeCode}/configuracion/cuenta`} class="flex min-w-0 items-center gap-2.5 text-ink no-underline" data-tour="store-edit" aria-label="Abrir perfil y cuenta">
							<span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-card text-body transition-colors hover:border-ember hover:text-ember">
								{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Avatar de tu cuenta" class="h-full w-full object-cover" />{:else}<i class="ri-user-line" style="font-size: 18px" aria-hidden="true"></i>{/if}
							</span>
							<span class="hidden min-w-0 sm:block"><span class="block truncate text-sm font-semibold">{auth.profile?.name ?? 'Mi cuenta'}</span><span class="block text-xs text-muted">Panel de vendedor</span></span>
						</a>
					</div>
					<div class="flex min-w-0 justify-center" data-tour="status"><SupabaseStatusNotch /></div>
					<a href={`/dashboard/s/${storeCode}/notificaciones`} data-tour="notifications" class="relative flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-card text-body no-underline transition-colors hover:border-ember hover:text-ember" aria-label="Abrir notificaciones" title="Notificaciones">
						<i class="ri-notification-3-line" style="font-size: 19px" aria-hidden="true"></i>
					</a>
					<span class="whitespace-nowrap rounded-full border border-ember/20 bg-ember/10 px-3 py-1.5 text-xs font-semibold text-ember">{auth.plan === 'free' ? 'Gratis' : auth.plan}</span>
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
					<i class={seg === storeCode || seg === 'resumen' || seg === 'inicio' || seg === 'estadisticas' ? 'ri-home-5-fill' : 'ri-home-5-line'} style="font-size: 22px; stroke-width: 1" aria-hidden="true"></i><span class="hidden sm:inline">Inicio</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/productos`} class:active-nav={seg === 'productos' || seg === 'cupones'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class={seg === 'productos' || seg === 'cupones' ? 'ri-box-3-fill' : 'ri-box-3-line'} style="font-size: 22px; stroke-width: 1" aria-hidden="true"></i><span class="hidden sm:inline">Productos</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/pedidos`} class:active-nav={seg === 'pedidos'} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class={seg === 'pedidos' ? 'ri-folders-fill' : 'ri-folders-line'} style="font-size: 22px; stroke-width: 1" aria-hidden="true"></i><span class="hidden sm:inline">Pedidos</span>
				</a>
				<a href={`/dashboard/s/${storeCode}/configuracion`} class:active-nav={page.url.pathname.includes('/configuracion')} class="flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors">
					<i class={page.url.pathname.includes('/configuracion') ? 'ri-settings-3-fill' : 'ri-settings-3-line'} style="font-size: 22px; stroke-width: 1" aria-hidden="true"></i><span class="hidden sm:inline">Ajustes</span>
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
	{#if showModal}
		<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-[10px] sm:items-center sm:p-4" onclick={(e) => { if (e.target === e.currentTarget) showModal = false; }} role="presentation">
			<div class="relative w-full max-w-sm rounded-t-[24px] border border-b-0 border-hairline bg-card p-6 text-center shadow-2xl sm:rounded-card sm:border-b">
				<div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-soft/50 sm:hidden" aria-hidden="true"></div>
				<button type="button" onclick={() => (showModal = false)} class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-bone hover:text-ink" aria-label="Cerrar"><i class="ri-close-line" aria-hidden="true"></i></button>
				<div class="mb-4 flex justify-center gap-3" aria-hidden="true">
					<i class="ri-telegram-fill text-4xl text-[#2AABEE]"></i>
					<i class="ri-whatsapp-fill text-4xl text-[#25D366]"></i>
				</div>
				<h3 class="mb-2 text-lg font-bold text-ink">Tiendly está en beta</h3>
				<p class="mb-5 text-sm leading-relaxed text-body">Tu feedback nos ayuda a construir la mejor plataforma de ecommerce para Cuba. Únete a nuestros grupos para reportar bugs, pedir features y ver novedades antes que nadie.</p>
				<div class="flex flex-col gap-2.5">
					<a href="https://chat.whatsapp.com/CUEMqyo4fAmBSl0HI1hMFA" target="_blank" rel="noopener noreferrer" onclick={() => (showModal = false)} class="flex min-h-12 w-full items-center justify-center gap-2 rounded-btn bg-[#25D366] px-4 py-3 font-semibold text-white no-underline shadow-[0_2px_0_#1da851] transition-transform active:translate-y-px active:shadow-none"><i class="ri-whatsapp-fill" aria-hidden="true"></i> Unirme al grupo de WhatsApp</a>
					<a href="https://t.me/+-rDvLllUjv8wOGRh" target="_blank" rel="noopener noreferrer" onclick={() => (showModal = false)} class="btn btn-3d btn-md flex min-h-12 w-full items-center justify-center gap-2 no-underline"><i class="ri-telegram-fill" aria-hidden="true"></i> Unirme al grupo de Telegram</a>
				</div>
				<button type="button" onclick={() => (showModal = false)} class="mt-4 text-xs text-muted transition-colors hover:text-body">Ahora no</button>
			</div>
		</div>
	{/if}
