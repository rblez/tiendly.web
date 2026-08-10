<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	let logoutOpen = $state(false);
	let loggingOut = $state(false);

	async function confirmLogout() {
		loggingOut = true;
		await auth.signOut();
		goto('/');
	}

	const profileName = $derived(auth.profile?.name ?? auth.session?.user.email ?? '');
	const avatar = $derived(auth.profile?.avatar_url ?? null);
	const profilePath = $derived($page.url.pathname === '/dash/profile');
</script>

<nav class="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">

			<a href="/dash" class="flex items-center gap-2 no-underline" aria-label="Tiendly">
				<img src="/isotipo.png" alt="Tiendly" class="h-7 w-7 rounded-md object-contain" />
				<span class="font-black text-lg tracking-tight text-ink hidden sm:inline">Tiendly</span>
			</a>

			<div class="flex items-center gap-4 sm:gap-6">
				<a
					href="/dash"
					class="flex items-center transition-colors duration-200 no-underline
						{$page.url.pathname === '/dash' ? 'text-ember' : 'text-body hover:text-ink'}"
				>
					<i class="{$page.url.pathname === '/dash' ? 'ri-store-2-fill' : 'ri-store-2-line'} text-xl sm:text-lg"></i>
					<span class="hidden sm:inline text-sm font-medium ml-1.5">Mis tiendas</span>
				</a>

				<a
					href="/dash/profile"
					class="flex items-center gap-2.5 rounded-full border transition-colors duration-200 no-underline
						{profilePath ? 'border-ember bg-ember/10' : 'border-hairline bg-card hover:border-ember/50'}"
					aria-label="Perfil"
					title="Perfil"
				>
					{#if avatar}
						<img src={avatar} alt={profileName} class="h-8 w-8 rounded-full object-cover" />
					{:else}
						<span class="h-8 w-8 rounded-full bg-ember text-white flex items-center justify-center font-bold text-sm">
							{(profileName || 'T').charAt(0).toUpperCase()}
						</span>
					{/if}
					<span class="hidden lg:inline text-sm font-medium text-body pr-3 max-w-32 truncate">{profileName}</span>
				</a>

				<button
					onclick={() => (logoutOpen = true)}
					class="flex items-center text-sm font-medium text-body hover:text-ink transition-colors cursor-pointer"
					aria-label="Cerrar sesión"
				>
					<i class="ri-logout-box-r-line text-lg sm:text-base sm:mr-1.5"></i>
					<span class="hidden sm:inline">Salir</span>
				</button>
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
