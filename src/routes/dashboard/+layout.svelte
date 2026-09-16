<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();
	let storeCode = $derived(page.params.code ?? '');
	let accountOpen = $state(false);
	let logoutConfirmOpen = $state(false);
	let notificationsEnabled = $state(true);
	let storeName = $state('Mi tienda');
	let storeLogo = $state<string | null>(null);
	const navItems = [
		{ label: 'Inicio', href: '', icon: 'ri-home-5-line' },
		{ label: 'Productos', href: '/productos', icon: 'ri-box-3-line' },
		{ label: 'Pedidos', href: '/pedidos', icon: 'ri-folder-3-line' },
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

	async function confirmSignOut() {
		await auth.signOut();
		logoutConfirmOpen = false;
		accountOpen = false;
		goto('/login');
	}

	onMount(async () => {
		const { data } = await supabase.from('stores').select('name, logo').eq('code', storeCode).maybeSingle();
		if (data) {
			storeName = data.name || 'Mi tienda';
			storeLogo = data.logo;
		}
	});

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
						<div class="flex min-w-0 items-center gap-3"><span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ember text-white">{#if storeLogo}<img src={storeLogo} alt={`Logo de ${storeName}`} class="h-full w-full object-cover" />{:else}<i class="ri-store-2-line text-lg"></i>{/if}</span><div class="min-w-0"><p class="truncate font-semibold tracking-tight">{storeName}</p><p class="hidden truncate text-[11px] text-muted sm:block">Panel de tu tienda</p></div></div>
						<div class="ml-auto flex items-center gap-2">
							<button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-card text-muted hover:text-ink" onclick={() => (notificationsEnabled = !notificationsEnabled)} aria-pressed={notificationsEnabled} aria-label={notificationsEnabled ? 'Silenciar notificaciones' : 'Activar notificaciones'}><i class={notificationsEnabled ? 'ri-notification-3-line' : 'ri-notification-off-line'}></i></button>
							<button class="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-card px-2.5 text-left" onclick={() => (accountOpen = !accountOpen)} aria-expanded={accountOpen} aria-label="Abrir menú de cuenta"><span class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-ember/10 text-ember">{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Avatar" class="h-full w-full object-cover" />{:else}<i class="ri-user-line text-sm"></i>{/if}</span><span class="hidden text-xs font-semibold sm:block">{auth.profile?.name ?? 'Mi cuenta'}</span><i class="ri-arrow-down-s-line text-muted"></i></button>
							{#if accountOpen}<div class="absolute right-4 top-14 z-50 w-56 rounded-2xl border border-hairline bg-card p-2 shadow-xl"><a href={`/dashboard/s/${storeCode}/configuracion/cuenta`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas" onclick={() => (accountOpen = false)}>Perfil</a><a href={`/dashboard/s/${storeCode}/configuracion/cuenta/seguridad`} class="block rounded-xl px-3 py-2 text-sm text-body no-underline hover:bg-canvas" onclick={() => (accountOpen = false)}>Seguridad</a><button type="button" class="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10" onclick={() => { accountOpen = false; logoutConfirmOpen = true; }}>Cerrar sesión</button></div>{/if}
							{#if logoutConfirmOpen}<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4" role="presentation" onclick={(event) => event.target === event.currentTarget && (logoutConfirmOpen = false)}><div class="w-full max-w-sm rounded-2xl border border-hairline bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="logout-title"><h2 id="logout-title" class="text-lg font-semibold text-ink">¿Cerrar sesión?</h2><p class="mt-2 text-sm text-muted">Tendrás que iniciar sesión nuevamente para entrar al panel.</p><div class="mt-5 flex justify-end gap-2"><button type="button" class="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:bg-canvas" onclick={() => (logoutConfirmOpen = false)}>Cancelar</button><button type="button" class="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white hover:opacity-90" onclick={confirmSignOut}>Cerrar sesión</button></div></div></div>{/if}
						</div>
					</div>
				</header>
				<div class="min-h-[calc(100vh-9rem)] pb-24">{@render children()}</div>
				<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl" aria-label="Navegación principal">
					<div class="mx-auto grid max-w-md grid-cols-4 gap-1">
						{#each navItems as item}
							<a href={`/dashboard/s/${storeCode}${item.href}`} class:is-current={isActive(item.href)} class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium text-muted no-underline transition-colors hover:text-ink" onclick={closeMenus} aria-current={isActive(item.href) ? 'page' : undefined}>
								<i class={`${item.icon} text-xl leading-none`}></i><span>{item.label}</span>
							</a>
						{/each}
					</div>
				</nav>
			</div>
		{:else}{@render children()}{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-32"><i class="ri-loader-4-line animate-spin text-ember" style="font-size: 24px" aria-label="Cargando"></i></div>
{/if}

<style>
	.is-current { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
</style>
