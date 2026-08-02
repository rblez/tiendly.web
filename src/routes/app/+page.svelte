<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';
	import type { Store } from '$lib/types';

	let stores = $state<Store[]>([]);
	let loading = $state(true);

	$effect(() => {
		if (!auth.ready || !auth.session) return;
		(async () => {
			loading = true;
			const { data } = await supabase
				.from('stores')
				.select('*')
				.eq('owner_id', auth.session!.user.id)
				.order('created_at', { ascending: false });
			stores = (data as Store[] | null) ?? [];
			loading = false;
		})();
	});
</script>

<svelte:head>
	<title>Mis tiendas | Tiendly</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
		<div>
			<h1 class="text-2xl sm:text-3xl font-bold text-ink">Mis tiendas</h1>
			<p class="text-sm text-muted mt-1">Administra tus tiendas y compártelas</p>
		</div>
		<a
			href="/crear"
			class="inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline"
		>
			<i class="ri-add-line"></i>
			Nueva tienda
		</a>
	</div>

	{#if loading}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
			{#each Array(3) as _, i}
				<div class="bg-card border border-hairline rounded-card p-6 animate-pulse">
					<div class="h-5 bg-bone rounded w-1/2 mb-4"></div>
					<div class="h-3 bg-bone rounded w-3/4 mb-2"></div>
					<div class="h-3 bg-bone rounded w-2/3"></div>
				</div>
			{/each}
		</div>
	{:else if stores.length === 0}
		<div class="text-center py-20 bg-card border border-hairline rounded-card">
			<div class="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
				<i class="ri-store-2-line text-3xl text-ember"></i>
			</div>
			<h2 class="text-xl font-bold text-ink mb-2">Aún no tienes tiendas</h2>
			<p class="text-body mb-6">Crea tu primera tienda gratis en menos de 5 minutos.</p>
			<a
				href="/crear"
				class="inline-flex items-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline"
			>
				<i class="ri-add-line"></i>
				Crear mi tienda
			</a>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
			{#each stores as store}
				<a href={`/app/store/${store.id}`} class="bg-card border border-hairline rounded-card p-6 transition-all duration-200 hover:border-ember/50 no-underline block">
					<div class="flex items-center gap-3 mb-4">
						{#if store.logo}
							<img src={store.logo} alt={store.name} class="h-12 w-12 object-cover rounded-lg bg-canvas" />
						{:else}
							<span class="h-12 w-12 flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-lg select-none">
								{store.name.charAt(0).toUpperCase()}
							</span>
						{/if}
						<div class="min-w-0">
							<h3 class="font-bold text-ink truncate">{store.name}</h3>
							<p class="text-xs text-muted truncate">/t/{store.slug}</p>
						</div>
					</div>
					{#if store.description}
						<p class="text-xs text-body line-clamp-2 mb-3">{store.description}</p>
					{/if}
					<div class="flex items-center gap-2 text-xs">
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bone text-body">
							<i class="ri-shopping-bag-line text-ember"></i>
							Gestionar
						</span>
						{#if !store.active}
							<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-error/10 text-error">
								<i class="ri-eye-off-line"></i>
								Oculta
							</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
