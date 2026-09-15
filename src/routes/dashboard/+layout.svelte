<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import SupabaseStatusNotch from '$lib/components/dashboard/SupabaseStatusNotch.svelte';
	let { children } = $props();
	let storeCode = $derived(page.params.code ?? '');
	let isSettingsSubpage = $derived(page.url.pathname.includes('/configuracion/'));
	let mobileOpen = $state(false);
	let accountOpen = $state(false);
	let soundOpen = $state(false);
	const navItems = [
		{ label: 'Inicio', href: '', icon: 'ri-home-5-line' },
		{ label: 'Productos', href: '/productos', icon: 'ri-box-3-line' },
		{ label: 'Pedidos', href: '/pedidos', icon: 'ri-shopping-bag-3-line' },
		{ label: 'Ajustes', href: '/configuracion', icon: 'ri-settings-3-line' }
	];
	let activePath = $derived(page.url.pathname);
	function isActive(href: string) {
		return href === '' ? activePath === `/dashboard/s/${storeCode}` || activePath.includes('/resumen') : activePath.includes(href);
	}
	$effect(() => {
		auth.init();
		if (auth.ready && !auth.session) goto('/login');
	});
</script>

{#if auth.ready && auth.session}
	<div class="min-h-screen bg-canvas text-ink" data-panel>
		{#if storeCode}
			<aside class="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-hairline bg-card lg:flex">
				<div class="flex h-20 items-center gap-3 border-b border-hairline px-6"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-white"><i class="ri-store-2-line text-lg"></i></span><div><p class="font-semibold tracking-tight">Tiendly</p><p class="text-[11px] text-muted">Panel de vendedor</p></div></div>
				<div class="px-4 pt-6"><p class="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Administrar tienda</p><nav class="mt-3 space-y-1" aria-label="Navegación principal">
					{#each navItems as item}<a href={`/dashboard/s/${storeCode}${item.href}`} class:is-current={isActive(item.href)} class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted no-underline transition-colors hover:bg-canvas hover:text-ink"><i class={item.icon + ' text-lg'}></i><span>{item.label}</span>{#if item.label === 'Pedidos'}<span class="ml-auto rounded-full bg-ember/10 px-2 py-0.5 text-[10px] font-bold text-ember">3</span>{/if}</a>{/each}
				</nav></div>
			<div class="mt-auto border-t border-hairline p-4"><a href={`/@${storeCode}`} target="_blank" class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-3 text-xs font-semibold text-body no-underline hover:text-ember"><i class="ri-external-link-line"></i>Ver tienda pública</a></div>
			</aside>
			<div class="lg:pl-64">
				<header class="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur-xl"><div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><button class="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-card lg:hidden" onclick={() => (mobileOpen = !mobileOpen)} aria-label="Abrir menú"><i class="ri-menu-2-line text-lg"></i></button><div class="hidden items-center gap-2 sm:flex"><span class="text-sm text-muted">Tienda</span><i class="ri-arrow-right-s-line text-muted"></i><span class="text-sm font-semibold">Mi Tienda Cuba</span></div><div class="ml-auto flex items-center gap-2"><div class="hidden sm:block" data-tour="status"><SupabaseStatusNotch /></div><button class="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-card text-body hover:text-ember" onclick={() => (soundOpen = !soundOpen)} aria-label="Configurar sonidos"><i class="ri-volume-up-line"></i></button><a href={`/dashboard/s/${storeCode}/notificaciones`} class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-card text-body hover:text-ember" aria-label="Notificaciones"><i class="ri-notification-3-line"></i><span class="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-ember"></span></a><button class="flex items-center gap-2 rounded-xl border border-hairline bg-card px-2 py-1.5" onclick={() => (accountOpen = !accountOpen)} aria-label="Abrir menú de cuenta"><span class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-ember/10 text-ember">{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Avatar" class="h-full w-full object-cover" />{:else}<i class="ri-user-line"></i>{/if}</span><span class="hidden text-left sm:block"><span class="block text-xs font-semibold">{auth.profile?.name ?? 'Mi cuenta'}</span><span class="block text-[10px] text-muted">Plan Gratis</span></span><i class="ri-arrow-down-s-line text-muted"></i></button></div></div></header>
				{#if soundOpen}<div class="absolute right-24 top-14 z-50 w-72 rounded-2xl border border-hairline bg-card p-4 shadow-xl"><p class="text-sm font-semibold">Sonidos</p><p class="mt-1 text-xs text-muted">Personaliza las alertas de tu tienda.</p><label class="mt-4 flex items-center justify-between text-xs"><span>Sonido de nuevos pedidos</span><input type="checkbox" checked /></label><label class="mt-3 flex items-center justify-between text-xs"><span>Notificaciones de Tiendly</span><input type="checkbox" checked /></label></div>{/if}
				{#if accountOpen}<div class="absolute right-4 top-14 z-50 w-56 rounded-2xl border border-hairline bg-card p-2 shadow-xl"><a href={`/dashboard/s/${storeCode}/configuracion/cuenta`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas">Información personal</a><a href={`/dashboard/s/${storeCode}/configuracion/cuenta/seguridad`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas">Seguridad y privacidad</a><a href={`/dashboard/s/${storeCode}/configuracion/planes`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas">Plan y facturación</a><button class="w-full rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10" onclick={() => auth.signOut()}>Cerrar sesión</button></div>{/if}
				{#if mobileOpen}<div class="fixed inset-0 z-50 bg-black/40 lg:hidden" role="presentation" tabindex="-1" onclick={() => (mobileOpen = false)} onkeydown={(event) => { if (event.key === 'Escape') mobileOpen = false; }}><div class="h-full w-72 border-r border-hairline bg-card p-5" role="dialog" aria-label="Menú de navegación móvil" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}><div class="mb-8 flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-white"><i class="ri-store-2-line"></i></span><b>Tiendly</b><button class="ml-auto" onclick={() => (mobileOpen = false)} aria-label="Cerrar menú"><i class="ri-close-line text-xl"></i></button></div>{#each navItems as item}<a href={`/dashboard/s/${storeCode}${item.href}`} class:is-current={isActive(item.href)} class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted no-underline"><i class={item.icon}></i>{item.label}</a>{/each}</div></div>{/if}
				<div class="min-h-[calc(100vh-4rem)]">{@render children()}</div>
			</div>
		{:else}{@render children()}{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-32">
		<i class="ri-loader-4-line animate-spin text-ember" style="font-size: 24px" aria-label="Cargando"></i>
	</div>
{/if}

<style>
	.is-current {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}
</style>
