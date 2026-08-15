<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	const profileName = $derived(auth.profile?.name ?? auth.session?.user.email ?? '');
	const avatar = $derived(auth.profile?.avatar_url ?? null);
	const isStoreRoute = $derived($page.url.pathname.startsWith('/dash/store/'));

	let menuOpen = $state(false);
	let logoutOpen = $state(false);
	let loggingOut = $state(false);

	function openShare() {
		window.dispatchEvent(new CustomEvent('tiendly:share-store'));
	}

	async function confirmLogout() {
		loggingOut = true;
		await auth.signOut();
		goto('/');
	}
</script>

<nav class="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<a href="/dash" class="flex items-center gap-2.5 no-underline group" aria-label="Mis tiendas" title="Mis tiendas">
				{#if isStoreRoute}
					<i class="ri-arrow-left-line text-muted group-hover:text-ink transition-colors"></i>
				{/if}
				<img src="/isotipo.png" alt="Tiendly" class="h-8 w-8 rounded-lg object-contain" />
				<span class="font-black text-lg tracking-tight text-ink">Tiendly</span>
			</a>

			<div class="flex items-center gap-3">
				{#if isStoreRoute}
					<button
						onclick={openShare}
						class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-btn text-sm font-semibold bg-ember text-white hover:bg-ember-active transition-colors cursor-pointer whitespace-nowrap"
					>
						<i class="ri-share-forward-line"></i>
						Compartir
					</button>
				{/if}

				<div class="relative flex-shrink-0">
					<button
						onclick={() => (menuOpen = !menuOpen)}
						class="inline-flex items-center rounded-full border transition-colors duration-200 cursor-pointer
							{menuOpen ? 'border-ember bg-ember/10' : 'border-hairline bg-card hover:border-ember/50'}"
						aria-label="Menú de perfil"
						aria-expanded={menuOpen}
						title="Perfil"
					>
						{#if avatar}
							<img src={avatar} alt={profileName} class="h-10 w-10 rounded-full object-cover" />
						{:else}
							<span class="h-10 w-10 rounded-full bg-ember text-white flex items-center justify-center font-bold text-lg">
								{(profileName || 'T').charAt(0).toUpperCase()}
							</span>
						{/if}
					</button>

					{#if menuOpen}
						<div class="fixed inset-0 z-40" onclick={() => (menuOpen = false)}></div>
						<div class="absolute right-0 mt-2 w-52 bg-card border border-hairline rounded-card shadow-xl overflow-hidden z-50">
							<div class="px-4 py-3 border-b border-hairline">
								<p class="text-sm font-semibold text-ink truncate">{profileName}</p>
								<p class="text-xs text-muted-soft truncate">{auth.session?.user.email ?? ''}</p>
							</div>
							<button
								onclick={() => {
									menuOpen = false;
									goto('/dash');
								}}
								class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-bone transition-colors cursor-pointer"
							>
								<i class="ri-store-2-line text-ember"></i>
								Mis tiendas
							</button>
							<button
								onclick={() => {
									menuOpen = false;
									goto('/dash/profile');
								}}
								class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-bone transition-colors cursor-pointer"
							>
								<i class="ri-user-line text-ember"></i>
								Perfil
							</button>
							<div class="border-t border-hairline"></div>
							<button
								onclick={() => {
									menuOpen = false;
									logoutOpen = true;
								}}
								class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-error hover:bg-error/10 transition-colors cursor-pointer"
							>
								<i class="ri-logout-box-r-line"></i>
								Cerrar sesión
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</nav>

{#if logoutOpen}
	<div class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" role="presentation">
		<button type="button" class="absolute inset-0 bg-black/60 cursor-default" onclick={() => (logoutOpen = false)} aria-label="Cerrar"></button>
		<div class="relative bg-card border border-hairline rounded-card w-full max-w-sm p-6 sm:p-8 text-center">
			<div class="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
				<i class="ri-logout-box-r-line text-2xl text-ember"></i>
			</div>
			<h2 class="text-lg font-bold text-ink mb-1">¿Cerrar sesión?</h2>
			<p class="text-sm text-muted mb-6">Volverás a la página de inicio y deberás iniciar sesión para administrar tus tiendas.</p>
			<div class="flex flex-col sm:flex-row gap-3">
				<button
					onclick={() => (logoutOpen = false)}
					class="flex-1 px-5 py-2.5 border border-hairline text-body rounded-btn text-sm font-medium transition-colors hover:bg-bone cursor-pointer"
				>
					Cancelar
				</button>
				<button
					onclick={confirmLogout}
					disabled={loggingOut}
					class="flex-1 inline-flex items-center justify-center gap-2 bg-error text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-50"
				>
					<i class="ri-logout-box-r-line"></i>
					{loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
				</button>
			</div>
		</div>
	</div>
{/if}