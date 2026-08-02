<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { PLAN_MAP, PLANS } from '$lib/plans';
	import type { Order, Product, Store } from '$lib/types';

	type StoreStats = Record<string, { products: number; orders: number; visits: number }>;

	let stores = $state<Store[]>([]);
	let stats = $state<StoreStats>({});
	let loading = $state(true);
	let upgradeOpen = $state(false);

	const plan = PLAN_MAP[auth.plan] ?? PLAN_MAP.free;
	const atLimit = $derived(stores.length >= (plan.limitStores ?? Infinity));

	$effect(() => {
		if (!auth.ready || !auth.session) return;
		(async () => {
			loading = true;
			const [storesRes, productsRes, ordersRes] = await Promise.all([
				supabase.from('stores').select('*').eq('owner_id', auth.session!.user.id).order('created_at', { ascending: false }),
				supabase.from('products').select('store_id').eq('active', true),
				supabase.from('orders').select('store_id'),
			]);

			const storeRows = (storesRes.data as Store[] | null) ?? [];
			stores = storeRows;
			loading = false;

			const acc: StoreStats = {};
			for (const s of storeRows) acc[s.id] = { products: 0, orders: 0, visits: s.visits ?? 0 };
			for (const p of productsRes.data ?? []) {
				const row = p as { store_id: string };
				if (acc[row.store_id]) acc[row.store_id].products += 1;
			}
			for (const o of ordersRes.data ?? []) {
				const row = o as { store_id: string };
				if (acc[row.store_id]) acc[row.store_id].orders += 1;
			}
			stats = acc;
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
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 bg-card border border-hairline rounded-btn px-3.5 py-2">
				<span class={`w-2 h-2 rounded-full ${plan.id === 'free' ? 'bg-muted' : 'bg-ember'}`}></span>
				<span class="text-sm font-semibold text-ink">{plan.name}</span>
				<span class="text-[10px] text-muted-soft font-medium">/ {plan.priceLabel}</span>
			</div>
			{#if atLimit}
				<button
					onclick={() => (upgradeOpen = true)}
					class="inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer"
				>
					<i class="ri-add-line"></i>
					Nueva tienda
				</button>
			{:else}
				<a
					href="/crear"
					class="inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline"
				>
					<i class="ri-add-line"></i>
					Nueva tienda
				</a>
			{/if}
		</div>
	</div>

	{#if atLimit}
		<button
			onclick={() => (upgradeOpen = true)}
			class="w-full flex items-start justify-between gap-4 bg-gradient-to-r from-ember/15 via-ember/5 to-transparent border border-ember/30 rounded-card p-5 text-left hover:border-ember/60 transition-colors cursor-pointer mb-8"
		>
			<div class="flex items-start gap-4 min-w-0">
				<span class="h-11 w-11 flex items-center justify-center rounded-xl bg-ember text-white flex-shrink-0">
					<i class="ri-star-line text-lg"></i>
				</span>
				<div class="text-left">
					<p class="font-bold text-ink">Estás en el plan Free</p>
					<p class="text-sm text-body mt-0.5">Solo incluye 1 tienda. Actualiza a Pro o Premium para más tiendas y productos.</p>
				</div>
			</div>
			<span class="inline-flex items-center gap-1.5 text-sm font-medium text-ember flex-shrink-0 mt-1">
				Mejorar plan
				<i class="ri-arrow-right-line"></i>
			</span>
		</button>
	{/if}

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
				<a href={`/app/store/${store.id}`} class="bg-card border border-hairline rounded-card p-6 transition-all duration-200 hover:border-ember/50 hover:shadow-sm no-underline block group">
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
						{#if !store.active}
							<span class="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-error/10 text-error text-[10px] flex-shrink-0">
								<i class="ri-eye-off-line"></i>
								Oculta
							</span>
						{/if}
					</div>
					{#if store.description}
						<p class="text-xs text-body line-clamp-2 mb-4">{store.description}</p>
					{/if}
					<div class="grid grid-cols-3 gap-2 mb-4">
						<div class="bg-canvas rounded-btn px-2 py-2 text-center">
							<p class="text-base font-bold text-ink tabular-nums">{stats[store.id]?.products ?? 0}</p>
							<p class="text-[10px] text-muted">Productos</p>
						</div>
						<div class="bg-canvas rounded-btn px-2 py-2 text-center">
							<p class="text-base font-bold text-ink tabular-nums">{stats[store.id]?.orders ?? 0}</p>
							<p class="text-[10px] text-muted">Pedidos</p>
						</div>
						<div class="bg-canvas rounded-btn px-2 py-2 text-center">
							<p class="text-base font-bold text-ink tabular-nums">{stats[store.id]?.visits ?? 0}</p>
							<p class="text-[10px] text-muted">Visitas</p>
						</div>
					</div>
					<div class="flex items-center gap-2 text-xs">
						<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-ember text-white font-medium">
							<i class="ri-settings-3-line"></i>
							Gestionar
						</span>
						<button onclick={() => window.open(`/t/${store.slug}`, '_blank', 'noopener,noreferrer')} class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-bone text-body hover:text-ember transition-colors cursor-pointer">
							<i class="ri-external-link-line"></i>
							Ver
						</button>
					</div>
				</a>
			{/each}
		</div>
	{/if}

	{#if upgradeOpen}
		<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="presentation">
			<button type="button" class="absolute inset-0 bg-black/60 cursor-default" onclick={() => (upgradeOpen = false)} aria-label="Cerrar"></button>
			<div class="relative bg-card border border-hairline rounded-card w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
				<button onclick={() => (upgradeOpen = false)} class="absolute top-4 right-4 text-muted hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
					<i class="ri-close-line text-xl"></i>
				</button>
				<h2 class="text-xl font-bold text-ink mb-1">Elige tu plan</h2>
				<p class="text-sm text-muted mb-6">Precios en USD · pago en cripto (USDT) · próximamente</p>

				<div class="grid gap-4 sm:grid-cols-3">
					{#each PLANS as p}
						<div class={`border rounded-card p-5 flex flex-col ${p.id === plan.id ? 'border-ember border-2' : 'border-hairline'}`}>
							<div class="flex items-center justify-between mb-1">
								<h3 class="font-bold text-ink">{p.name}</h3>
								{#if p.id === plan.id}
									<span class="text-[10px] font-bold bg-ember/10 text-ember rounded-full px-2 py-0.5">Actual</span>
								{:else if p.id === 'premium'}
									<span class="text-[10px] font-bold bg-ember text-white rounded-full px-2 py-0.5">Top</span>
								{/if}
							</div>
							<p class="text-2xl font-black text-ink mb-1">{p.priceLabel}</p>
							<p class="text-xs text-muted mb-4">{p.tagline}</p>
							<ul class="space-y-1.5 mb-5 flex-1">
								{#each p.features as feat}
									<li class="text-xs text-body flex items-start gap-1.5">
										<i class="ri-check-line text-ember mt-0.5 flex-shrink-0"></i>
										{feat}
									</li>
								{/each}
							</ul>
							{#if p.id !== 'free'}
								<span
									class="w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-4 py-2.5 rounded-btn text-sm font-medium no-underline opacity-90"
								>
									<i class="ri-currency-line"></i>
									Próximamente
								</span>
							{/if}
						</div>
					{/each}
				</div>

				<p class="text-xs text-muted-soft mt-5 flex items-center gap-1.5">
					<i class="ri-gift-line"></i>
					Al suscribirte a un plan de pago soportas el desarrollo de Tiendly.
				</p>
			</div>
		</div>
	{/if}
</section>