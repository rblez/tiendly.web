<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import SupabaseStatusNotch from '$lib/components/dashboard/SupabaseStatusNotch.svelte';

	let { children } = $props();
	let storeCode = $derived(page.params.code ?? '');
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
	}

	$effect(() => {
		auth.init();
		if (auth.ready && !auth.session) goto('/login');
	});
</script>

{#if auth.ready && auth.session}
	<div class="min-h-screen bg-canvas text-ink" data-panel>
		{#if storeCode}
			<div>
				<header class="sticky top-0 z-30 border-b border-hairline bg-canvas/95 backdrop-blur-xl">
					<div class="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
						<div class="flex min-w-0 items-center gap-3"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember text-white"><i class="ri-store-2-line text-lg"></i></span><div class="min-w-0"><p class="truncate font-semibold tracking-tight">Tiendly</p><p class="hidden truncate text-[11px] text-muted sm:block">Panel de tu tienda</p></div></div>
						<div class="ml-auto flex items-center gap-2">
							<div class="hidden md:block"><SupabaseStatusNotch /></div>
							<button class="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-card px-2.5 text-left" onclick={() => (accountOpen = !accountOpen)} aria-expanded={accountOpen} aria-label="Abrir menú de cuenta"><span class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-ember/10 text-ember">{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Avatar" class="h-full w-full object-cover" />{:else}<i class="ri-user-line text-sm"></i>{/if}</span><span class="hidden text-xs font-semibold sm:block">{auth.profile?.name ?? 'Mi cuenta'}</span><i class="ri-arrow-down-s-line text-muted"></i></button>
							{#if accountOpen}<div class="absolute right-4 top-14 z-50 w-56 rounded-2xl border border-hairline bg-card p-2 shadow-xl"><a href={`/dashboard/s/${storeCode}/configuracion/cuenta`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas" onclick={() => (accountOpen = false)}>Mi cuenta</a><a href={`/dashboard/s/${storeCode}/configuracion`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas" onclick={() => (accountOpen = false)}>Ajustes de tienda</a><button class="w-full rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10" onclick={() => auth.signOut()}>Cerrar sesión</button></div>{/if}
						</div>
					</div>
				</header>
				<nav class="border-b border-hairline bg-canvas px-4 py-3 sm:px-6 lg:px-8" aria-label="Navegación principal">
					<div class="scrollbar-none flex gap-2 overflow-x-auto rounded-full border border-hairline bg-card p-1.5 shadow-sm">
						{#each navItems as item}
							<a href={`/dashboard/s/${storeCode}${item.href}`} class:is-current={isActive(item.href)} class="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted no-underline transition-colors hover:text-ink" onclick={closeMenus}>
								<i class={item.icon}></i><span>{item.label}</span>
							</a>
						{/each}
						<a href={`/@${storeCode}`} target="_blank" rel="noreferrer" class="ml-auto flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted no-underline hover:text-ink"><i class="ri-external-link-line"></i><span>Ver tienda</span></a>
					</div>
				</nav>
				<div class="min-h-[calc(100vh-9rem)]">{@render children()}</div>
			</div>
		{:else}{@render children()}{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-32"><i class="ri-loader-4-line animate-spin text-ember" style="font-size: 24px" aria-label="Cargando"></i></div>
{/if}

<style>
	.is-current { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
</style>
