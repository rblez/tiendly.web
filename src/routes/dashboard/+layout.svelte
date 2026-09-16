<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import SupabaseStatusNotch from '$lib/components/dashboard/SupabaseStatusNotch.svelte';

	let { children } = $props();
	let storeCode = $derived(page.params.code ?? '');
	let mobileOpen = $state(false);
	let accountOpen = $state(false);
	const navItems = [
		{ label: 'Inicio', href: '', icon: 'ri-home-5-line' },
		{ label: 'Productos', href: '/productos', icon: 'ri-box-3-line' },
		{ label: 'Pedidos', href: '/pedidos', icon: 'ri-shopping-bag-3-line' },
		{ label: 'Ajustes', href: '/configuracion', icon: 'ri-settings-3-line' }
	];
	let activePath = $derived(page.url.pathname);

	function isActive(href: string) {
		return href === ''
			? activePath === `/dashboard/s/${storeCode}` || activePath.includes('/resumen')
			: activePath.includes(href);
	}

	function closeMenus() {
		accountOpen = false;
		mobileOpen = false;
	}

	$effect(() => {
		auth.init();
		if (auth.ready && !auth.session) goto('/login');
	});
</script>

{#if auth.ready && auth.session}
	<div class="min-h-screen bg-canvas text-ink" data-panel>
		{#if storeCode}
			<aside class="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-hairline bg-card lg:flex">
				<div class="flex h-16 items-center gap-3 border-b border-hairline px-5">
					<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-white"><i class="ri-store-2-line text-lg"></i></span>
					<div><p class="font-semibold tracking-tight">Tiendly</p><p class="text-[11px] text-muted">Panel de tu tienda</p></div>
				</div>
				<div class="px-3 pt-5">
					<p class="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Menú</p>
					<nav class="mt-2 space-y-1" aria-label="Navegación principal">
						{#each navItems as item}
							<a href={`/dashboard/s/${storeCode}${item.href}`} class:is-current={isActive(item.href)} class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted no-underline transition-colors hover:bg-canvas hover:text-ink" onclick={closeMenus}>
								<i class={item.icon + ' text-[18px]'}></i><span>{item.label}</span>
							</a>
						{/each}
					</nav>
				</div>
				<div class="mt-auto border-t border-hairline p-3">
					<a href={`/@${storeCode}`} target="_blank" rel="noreferrer" class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted no-underline hover:bg-canvas hover:text-ink"><i class="ri-external-link-line"></i>Ver tienda pública</a>
				</div>
			</aside>

			<div class="lg:pl-60">
				<header class="sticky top-0 z-30 border-b border-hairline bg-canvas/95 backdrop-blur-xl">
					<div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
						<button class="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-card lg:hidden" onclick={() => (mobileOpen = true)} aria-label="Abrir menú"><i class="ri-menu-2-line text-lg"></i></button>
						<div class="min-w-0"><p class="truncate text-sm font-semibold">Mi tienda</p><p class="hidden text-[11px] text-muted sm:block">Administra tu catálogo y tus pedidos</p></div>
						<div class="ml-auto flex items-center gap-2">
							<div class="hidden md:block"><SupabaseStatusNotch /></div>
							<button class="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-card px-2.5 text-left" onclick={() => (accountOpen = !accountOpen)} aria-expanded={accountOpen} aria-label="Abrir menú de cuenta"><span class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-ember/10 text-ember">{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Avatar" class="h-full w-full object-cover" />{:else}<i class="ri-user-line text-sm"></i>{/if}</span><span class="hidden text-xs font-semibold sm:block">{auth.profile?.name ?? 'Mi cuenta'}</span><i class="ri-arrow-down-s-line text-muted"></i></button>
							{#if accountOpen}<div class="absolute right-4 top-14 z-50 w-56 rounded-2xl border border-hairline bg-card p-2 shadow-xl"><a href={`/dashboard/s/${storeCode}/configuracion/cuenta`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas" onclick={() => (accountOpen = false)}>Mi cuenta</a><a href={`/dashboard/s/${storeCode}/configuracion`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas" onclick={() => (accountOpen = false)}>Ajustes de tienda</a><button class="w-full rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10" onclick={() => auth.signOut()}>Cerrar sesión</button></div>{/if}
						</div>
					</div>
				</header>
				<div class="min-h-[calc(100vh-4rem)]">{@render children()}</div>
			</div>

			{#if mobileOpen}
				<div class="fixed inset-0 z-50 bg-black/40 lg:hidden" role="presentation" tabindex="-1" onclick={() => (mobileOpen = false)} onkeydown={(event) => event.key === 'Escape' && (mobileOpen = false)}>
					<div class="h-full w-72 border-r border-hairline bg-card p-5" role="dialog" tabindex="-1" aria-label="Menú de navegación móvil" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
						<div class="mb-8 flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-white"><i class="ri-store-2-line"></i></span><b>Tiendly</b><button class="ml-auto" onclick={() => (mobileOpen = false)} aria-label="Cerrar menú"><i class="ri-close-line text-xl"></i></button></div>
						<nav aria-label="Navegación móvil" class="space-y-1">{#each navItems as item}<a href={`/dashboard/s/${storeCode}${item.href}`} class:is-current={isActive(item.href)} class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted no-underline" onclick={closeMenus}><i class={item.icon}></i>{item.label}</a>{/each}</nav>
					</div>
				</div>
			{/if}
		{:else}{@render children()}{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-32"><i class="ri-loader-4-line animate-spin text-ember" style="font-size: 24px" aria-label="Cargando"></i></div>
{/if}

<style>
	.is-current { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
</style>
