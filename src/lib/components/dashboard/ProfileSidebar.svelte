<script lang="ts">
	import { goto } from '$app/navigation';
	import { PLAN_MAP } from '$lib/plans';
	import { auth } from '$lib/stores/auth.svelte';
	import { dashUi } from '$lib/stores/dash.svelte';

	const profileName = $derived(auth.profile?.name ?? auth.session?.user.email ?? '');
	const avatar = $derived(auth.profile?.avatar_url ?? null);
	const planLabel = $derived(PLAN_MAP[auth.plan].name);

	let logoutOpen = $state(false);
	let loggingOut = $state(false);

	async function confirmLogout() {
		loggingOut = true;
		await auth.signOut();
		goto('/');
	}
</script>

{#snippet profileContent()}
	<div class="bg-card border border-hairline rounded-card p-4">
		{#if avatar}
			<img src={avatar} alt={profileName} class="h-14 w-14 rounded-full object-cover mx-auto" />
		{:else}
			<span class="h-14 w-14 rounded-full bg-ember text-white flex items-center justify-center font-black text-xl mx-auto">
				{(profileName || 'T').charAt(0).toUpperCase()}
			</span>
		{/if}
		<p class="font-bold text-ink text-center mt-2.5 truncate">{profileName}</p>
		<p class="text-xs text-muted-soft text-center truncate">{auth.session?.user.email ?? ''}</p>
		<span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ember/10 text-ember mt-2.5">{planLabel}</span>
		<a href="/dashboard/profile" class="btn btn-secondary btn-md w-full mt-4 no-underline">Editar perfil</a>
	</div>

	<nav class="bg-card border border-hairline rounded-card p-2 space-y-1">
		<a
			href="/dashboard"
			class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-sm font-medium text-left no-underline hover:bg-bone transition-colors cursor-pointer"
		>
			<i class="ri-store-2-line"></i>
			Mis tiendas
		</a>
		<a
			href="/dashboard/profile"
			class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-sm font-medium text-left no-underline hover:bg-bone transition-colors cursor-pointer"
		>
			<i class="ri-user-line"></i>
			Perfil
		</a>
		<div class="border-t border-hairline my-1"></div>
		<button
			onclick={() => (logoutOpen = true)}
			class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-sm font-medium text-left text-error hover:bg-error/10 transition-colors cursor-pointer"
		>
			<i class="ri-logout-box-r-line"></i>
			Cerrar sesión
		</button>
	</nav>
{/snippet}

{#if dashUi.profileOpen}
	<aside class="hidden md:block w-64 shrink-0">
		{@render profileContent()}
	</aside>
{/if}

{#if dashUi.profileOpen}
	<button
		class="md:hidden fixed inset-0 z-40 bg-black/50 cursor-default"
		onclick={() => dashUi.setProfile(false)}
		aria-label="Cerrar menú"
	></button>
	<div class="md:hidden fixed inset-y-0 right-0 z-40 w-72 max-w-[85vw] bg-card border-l border-hairline overflow-y-auto p-4 flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<p class="text-sm font-bold text-ink">Perfil</p>
			<button
				onclick={() => dashUi.setProfile(false)}
				class="w-9 h-9 flex items-center justify-center rounded-btn border border-hairline bg-card hover:border-ember/50 transition-colors cursor-pointer text-ink"
				aria-label="Cerrar menú"
				title="Cerrar menú"
			>
				<i class="ri-close-line"></i>
			</button>
		</div>
		{@render profileContent()}
	</div>
{/if}

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
				<button onclick={() => (logoutOpen = false)} class="btn btn-secondary btn-md flex-1 cursor-pointer">
					Cancelar
				</button>
				<button onclick={confirmLogout} disabled={loggingOut} class="btn btn-danger btn-md flex-1 disabled:opacity-50">
					<i class="ri-logout-box-r-line"></i>
					{loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
				</button>
			</div>
		</div>
	</div>
{/if}