<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase/client';

	let storeAvatar = $state<string | null>(null);
	let storeName = $state('');

	const profileName = $derived(auth.profile?.name ?? auth.session?.user.email ?? '');
	const avatar = $derived(auth.profile?.avatar_url ?? null);
	const profilePath = $derived($page.url.pathname === '/dash/profile');
	const isStoreRoute = $derived($page.url.pathname.startsWith('/dash/store/'));
	const storeCode = $derived(isStoreRoute ? $page.url.pathname.split('/')[3] ?? null : null);
	const displayName = $derived(isStoreRoute && storeName ? storeName : profileName);
	const displayAvatar = $derived(isStoreRoute ? storeAvatar : avatar);

	$effect(() => {
		const code = storeCode;
		storeAvatar = null;
		storeName = '';
		if (!code) return;
		supabase
			.from('stores')
			.select('logo, name')
			.eq('code', code)
			.maybeSingle()
			.then(({ data }) => {
				if (data) {
					storeAvatar = data.logo;
					storeName = data.name;
				}
			});
	});
</script>

<nav class="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center h-16">
			<a href="/dash" class="flex items-center gap-2 no-underline" aria-label="Tiendly">
				<img src="/isotipo.png" alt="Tiendly" class="h-7 w-7 rounded-md object-contain" />
				<span class="font-black text-lg tracking-tight text-ink hidden sm:inline">Tiendly</span>
			</a>

			<a
				href="/dash/profile"
				class="flex items-center gap-2.5 ml-4 sm:ml-6 rounded-full border transition-colors duration-200 no-underline
					{profilePath ? 'border-ember bg-ember/10' : 'border-hairline bg-card hover:border-ember/50'}"
				aria-label="Perfil"
				title="Perfil"
			>
				{#if displayAvatar}
					<img src={displayAvatar} alt={displayName} class="h-8 w-8 rounded-full object-cover" />
				{:else}
					<span class="h-8 w-8 rounded-full bg-ember text-white flex items-center justify-center font-bold text-sm">
						{(displayName || 'T').charAt(0).toUpperCase()}
					</span>
				{/if}
				<span class="hidden lg:inline text-sm font-medium text-body pr-3 max-w-32 truncate">{displayName}</span>
			</a>
		</div>
	</div>
</nav>