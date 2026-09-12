<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import SupabaseStatusNotch from '$lib/components/dashboard/SupabaseStatusNotch.svelte';

	let { children, data } = $props();
	let storeCode = $derived(page.params.code ?? '');
	let isSettingsSubpage = $derived(page.url.pathname.includes('/configuracion/'));

	$effect(() => {
		if (data.localPanelBypass) {
			auth.hydrateLocalDemoSession(data.user.id);
			return;
		}
		auth.init();
		if (auth.ready && !auth.session) {
			goto('/login');
		}
	});

	const navItems = [
		{ href: '', match: ['', 'resumen', 'inicio', 'estadisticas'], icon: 'ri-home-5', label: 'Inicio' },
		{ href: '/productos', match: ['productos', 'cupones'], icon: 'ri-box-3', label: 'Productos' },
		{ href: '/pedidos', match: ['pedidos'], icon: 'ri-folders', label: 'Pedidos' },
		{ href: '/configuracion', match: ['configuracion'], icon: 'ri-settings-3', label: 'Ajustes' },
	] as const;

	function isActive(seg: string, match: readonly string[]) {
		return match.includes(seg);
	}
</script>

{#if auth.ready && auth.session}
	<div class="flex min-h-screen flex-col lg:flex-row" data-panel>
		{#if storeCode && !isSettingsSubpage}
			{@const seg = page.url.pathname.split('/').filter(Boolean).pop() ?? ''}

			<!-- Sidebar: escritorio -->
			<aside class="hidden w-64 shrink-0 flex-col border-r border-hairline bg-canvas-soft lg:flex" aria-label="Navegación principal">
				<div class="flex items-center gap-2.5 px-5 py-5">
					<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-ember/12 text-ember">
						<i class="ri-store-2-line" style="font-size: 18px" aria-hidden="true"></i>
					</span>
					<span class="min-w-0">
						<span class="block truncate text-sm font-semibold font-display text-ink">Tiendly</span>
						<span class="block truncate text-xs text-muted">Panel de vendedor</span>
					</span>
				</div>

				<nav class="flex flex-1 flex-col gap-1 px-3" aria-label="Secciones de la tienda">
					{#each navItems as item (item.label)}
						<a
							href={`/dashboard/s/${storeCode}${item.href}`}
							aria-current={isActive(seg, item.match) ? 'page' : undefined}
							class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-colors"
							class:sidebar-active={isActive(seg, item.match)}
							class:text-muted={!isActive(seg, item.match)}
						>
							<i class={isActive(seg, item.match) ? `${item.icon}-fill` : `${item.icon}-line`} style="font-size: 19px" aria-hidden="true"></i>
							{item.label}
						</a>
					{/each}
				</nav>

				<div class="border-t border-hairline px-3 py-3">
					<a
						href={`/dashboard/s/${storeCode}/configuracion/cuenta`}
						class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-ink no-underline transition-colors hover:bg-bone"
						aria-label="Abrir perfil y cuenta"
					>
						<span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-card text-body">
							{#if auth.profile?.avatar_url}
								<img src={auth.profile.avatar_url} alt="Avatar de tu cuenta" class="h-full w-full object-cover" />
							{:else}
								<i class="ri-user-line" style="font-size: 18px" aria-hidden="true"></i>
							{/if}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-semibold">{auth.profile?.name ?? 'Mi cuenta'}</span>
							<span class="block truncate text-xs text-muted capitalize">{auth.plan === 'free' ? 'Plan gratis' : `Plan ${auth.plan}`}</span>
						</span>
						<i class="ri-arrow-right-s-line text-muted" style="font-size: 16px" aria-hidden="true"></i>
					</a>
				</div>
			</aside>

			<!-- Topbar: móvil / tablet -->
			<header class="sticky top-0 z-40 border-b border-hairline bg-canvas/95 lg:hidden">
				<div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
					<a href={`/dashboard/s/${storeCode}/configuracion/cuenta`} class="flex min-w-0 flex-1 items-center gap-2.5 text-ink no-underline" data-tour="store-edit" aria-label="Abrir perfil y cuenta">
						<span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-card text-body transition-colors hover:border-ember hover:text-ember">
							{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Avatar de tu cuenta" class="h-full w-full object-cover" />{:else}<i class="ri-user-line" style="font-size: 18px" aria-hidden="true"></i>{/if}
						</span>
						<span class="hidden min-w-0 sm:block"><span class="block truncate text-sm font-semibold">{auth.profile?.name ?? 'Mi cuenta'}</span><span class="block text-xs text-muted">Panel de vendedor</span></span>
					</a>
					<div class="flex min-w-0 justify-center" data-tour="status"><SupabaseStatusNotch /></div>
					<a href={`/dashboard/s/${storeCode}/notificaciones`} data-tour="notifications" class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-body no-underline transition-colors hover:border-ember hover:text-ember" aria-label="Abrir notificaciones" title="Notificaciones">
						<i class="ri-notification-3-line" style="font-size: 19px" aria-hidden="true"></i>
					</a>
					<span class="chip shrink-0 border border-ember/20 bg-ember/10 text-ember">{auth.plan === 'free' ? 'Gratis' : auth.plan}</span>
				</div>
			</header>
		{/if}

		<div class:flex-1={!isSettingsSubpage} class="min-w-0 {isSettingsSubpage ? 'flex-1' : 'flex-1 pb-24 lg:pb-0'}">
			{@render children()}
		</div>

		{#if storeCode && !isSettingsSubpage}
			{@const seg = page.url.pathname.split('/').filter(Boolean).pop() ?? ''}
			<nav class="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 gap-1 border-t border-hairline acrylic px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-2xl lg:hidden" aria-label="Navegación de la tienda">
				{#each navItems as item (item.label)}
					<a
						href={`/dashboard/s/${storeCode}${item.href}`}
						aria-current={isActive(seg, item.match) ? 'page' : undefined}
						class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold text-muted no-underline transition-colors"
						class:active-nav={isActive(seg, item.match)}
					>
						<i class={isActive(seg, item.match) ? `${item.icon}-fill` : `${item.icon}-line`} style="font-size: 22px; stroke-width: 1" aria-hidden="true"></i>
						<span class="hidden sm:inline">{item.label}</span>
					</a>
				{/each}
			</nav>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-32">
		<i class="ri-loader-4-line animate-spin text-ember" style="font-size: 24px" aria-label="Cargando"></i>
	</div>
{/if}

<style>
	.active-nav,
	.sidebar-active {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
	}
</style>
