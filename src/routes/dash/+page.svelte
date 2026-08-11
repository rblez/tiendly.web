<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { storeUrl } from '$lib/utils';
	import { PLAN_MAP, PLANS, planWhatsAppUrl } from '$lib/plans';
	import type { Store } from '$lib/types';

	type StoreStats = Record<string, { products: number; orders: number; visits: number }>;

	let stores = $state<Store[]>([]);
	let stats = $state<StoreStats>({});
	let loading = $state(true);
	let upgradeOpen = $state(false);
	let deleteTarget = $state<Store | null>(null);
	let deleting = $state(false);
	let loadError = $state('');
	let deleteError = $state('');
	let mobileMenuOpen = $state(false);

	const plan = PLAN_MAP[auth.plan] ?? PLAN_MAP.free;
	const atLimit = $derived(stores.length >= (plan.limitStores ?? Infinity));
	const totalProducts = $derived(Object.values(stats).reduce((s, v) => s + v.products, 0));
	const totalOrders = $derived(Object.values(stats).reduce((s, v) => s + v.orders, 0));
	const totalVisits = $derived(Object.values(stats).reduce((s, v) => s + v.visits, 0));

	async function confirmDelete() {
		const target = deleteTarget;
		if (!target || !auth.session) return;
		deleting = true;
		deleteError = '';
		const { error: err } = await supabase.from('stores').delete().eq('id', target.id);
		deleting = false;
		if (err) {
			deleteError = err.message;
			return;
		}
		stores = stores.filter((s) => s.id !== target.id);
		deleteTarget = null;
	}

	async function loadStores() {
		loading = true;
		loadError = '';
		try {
			const [storesRes, productsRes, ordersRes] = await Promise.all([
				supabase.from('stores').select('*').eq('owner_id', auth.session!.user.id).order('created_at', { ascending: false }),
				supabase.from('products').select('store_id').eq('active', true),
				supabase.from('orders').select('store_id'),
			]);

			const storeRows = (storesRes.data as Store[] | null) ?? [];
			stores = storeRows;

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
		} catch {
			loadError = 'No se pudieron cargar tus tiendas.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!auth.ready || !auth.session) return;
		loadStores();
	});
</script>

<svelte:head>
	<title>Dashboard | Tiendly</title>
</svelte:head>

<div class="min-h-screen flex">
	<aside class="hidden lg:flex w-56 xl:w-60 flex-shrink-0 flex-col bg-canvas border-r border-hairline h-screen sticky top-0 overflow-y-auto">
		<div class="px-4 py-4 border-b border-hairline">
			<a href="/dash" class="flex items-center gap-2.5 no-underline group">
				<img src="/isotipo.png" alt="Tiendly" class="h-7 w-7 rounded-md" />
				<span class="font-black text-base tracking-tight text-ink">Tiendly</span>
			</a>
		</div>
		<nav class="flex-1 p-3 space-y-0.5">
			<a href="/dash" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-ember/10 text-ember no-underline">
				<i class="ri-store-2-fill text-lg"></i>
				Projects
			</a>
			<a href="/dash/profile" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-soft hover:text-ink hover:bg-bone transition-colors no-underline">
				<i class="ri-user-settings-line text-lg"></i>
				Settings
			</a>
			<a href="/pricing" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-soft hover:text-ink hover:bg-bone transition-colors no-underline">
				<i class="ri-vip-crown-line text-lg"></i>
				Planes
			</a>
		</nav>
		<div class="p-3 border-t border-hairline">
			<div class="px-3 py-2">
				<div class="flex items-center gap-2 mb-1">
					<span class="w-2 h-2 rounded-full {plan.id === 'free' ? 'bg-muted' : 'bg-ember'}"></span>
					<span class="text-sm font-semibold text-ink">{plan.name}</span>
				</div>
				<p class="text-[11px] text-muted-soft pl-4">∞ tiendas · {plan.limitStores === Infinity ? '∞' : plan.limitStores} tiendas</p>
			</div>
			<a
				href="/dash/profile?tab=privacidad"
				class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-soft hover:text-ink hover:bg-bone transition-colors no-underline"
			>
				<img
					src={auth.profile?.avatar_url || undefined}
					alt=""
					class="h-6 w-6 rounded-full object-cover"
				/>
				<span class="truncate text-body">{auth.profile?.name ?? auth.session?.user.email ?? ''}</span>
			</a>
		</div>
	</aside>

	<div class="flex-1 min-w-0">
		<header class="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-hairline px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-14">
				<div class="flex items-center gap-3">
					<button
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						class="lg:hidden p-2 -ml-2 text-muted hover:text-ink transition-colors cursor-pointer"
						aria-label="Menu"
					>
						<i class="ri-menu-line text-xl"></i>
					</button>
					<h1 class="text-sm font-semibold text-ink">All Projects</h1>
					<span class="text-xs text-muted-soft bg-bone rounded-full px-2 py-0.5">{stores.length}</span>
				</div>
				<div class="flex items-center gap-3">
					<a
						href="/dash/profile"
						class="lg:hidden flex items-center gap-2 rounded-full border border-hairline bg-card hover:border-ember/50 transition-colors no-underline"
						aria-label="Perfil"
					>
						{#if auth.profile?.avatar_url}
							<img src={auth.profile.avatar_url} alt="" class="h-8 w-8 rounded-full object-cover" />
						{:else}
							<span class="h-8 w-8 rounded-full bg-ember text-white flex items-center justify-center font-bold text-sm">
								{(auth.profile?.name ?? auth.session?.user.email ?? 'T').charAt(0).toUpperCase()}
							</span>
						{/if}
					</a>
					{#if atLimit}
						<button
							onclick={() => (upgradeOpen = true)}
							class="inline-flex items-center gap-2 bg-ember text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ember-active transition-colors cursor-pointer"
						>
							<i class="ri-add-line"></i>
							<span class="hidden sm:inline">Add New</span>
						</button>
					{:else}
						<a
							href="/wizard"
							class="inline-flex items-center gap-2 bg-ember text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ember-active transition-colors no-underline"
						>
							<i class="ri-add-line"></i>
							<span class="hidden sm:inline">Add New</span>
						</a>
					{/if}
				</div>
			</div>
		</header>

		<main class="p-4 sm:p-6 lg:p-8">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
				<div class="bg-card border border-hairline rounded-xl px-4 py-3">
					<p class="text-[11px] text-muted uppercase tracking-wide mb-1">Tiendas</p>
					<p class="text-xl font-black text-ink tabular-nums">{stores.length}</p>
				</div>
				<div class="bg-card border border-hairline rounded-xl px-4 py-3">
					<p class="text-[11px] text-muted uppercase tracking-wide mb-1">Productos</p>
					<p class="text-xl font-black text-ink tabular-nums">{totalProducts}</p>
				</div>
				<div class="bg-card border border-hairline rounded-xl px-4 py-3">
					<p class="text-[11px] text-muted uppercase tracking-wide mb-1">Pedidos</p>
					<p class="text-xl font-black text-ink tabular-nums">{totalOrders}</p>
				</div>
				<div class="bg-card border border-hairline rounded-xl px-4 py-3">
					<p class="text-[11px] text-muted uppercase tracking-wide mb-1">Visitas</p>
					<p class="text-xl font-black text-ink tabular-nums">{totalVisits}</p>
				</div>
			</div>

			{#if atLimit}
				<button
					onclick={() => (upgradeOpen = true)}
					class="w-full flex items-center justify-between bg-card border border-ember/30 rounded-xl px-5 py-4 mb-6 hover:border-ember/60 transition-colors cursor-pointer"
				>
					<div class="flex items-center gap-3 min-w-0">
						<div class="w-10 h-10 rounded-lg bg-ember/10 flex items-center justify-center flex-shrink-0">
							<i class="ri-vip-crown-line text-lg text-ember"></i>
						</div>
						<div class="text-left min-w-0">
							<p class="text-sm font-bold text-ink">Plan {plan.name}</p>
							<p class="text-xs text-muted-soft">Actualiza para crear más tiendas</p>
						</div>
					</div>
					<span class="text-sm font-medium text-ember flex-shrink-0 ml-3">Mejorar</span>
				</button>
			{/if}

			{#if loadError}
				<div class="flex items-center gap-2.5 bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 mb-6 text-sm">
					<i class="ri-error-warning-line flex-shrink-0"></i>
					<p>{loadError}</p>
					<button onclick={() => loadStores()} class="ml-auto text-xs font-semibold underline cursor-pointer">Reintentar</button>
				</div>
			{/if}

			{#if loading}
				<div class="space-y-3">
					{#each Array(3) as _}
						<div class="bg-card border border-hairline rounded-xl px-5 py-4 animate-pulse">
							<div class="flex items-center gap-4">
								<div class="h-10 w-10 bg-bone rounded-lg"></div>
								<div class="flex-1">
									<div class="h-4 bg-bone rounded w-40 mb-2"></div>
									<div class="h-3 bg-bone rounded w-28"></div>
								</div>
								<div class="h-6 bg-bone rounded-full w-20"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if stores.length === 0}
				<div class="text-center py-24 bg-card border border-hairline rounded-2xl">
					<div class="w-16 h-16 bg-ember/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
						<i class="ri-store-2-line text-3xl text-ember"></i>
					</div>
					<h2 class="text-xl font-bold text-ink mb-2">No hay proyectos aún</h2>
					<p class="text-sm text-muted mb-6">Crea tu primera tienda en menos de 5 minutos.</p>
					<a
						href="/wizard"
						class="inline-flex items-center gap-2 bg-ember text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-ember-active transition-colors no-underline"
					>
						<i class="ri-add-line"></i>
						Add New
					</a>
				</div>
			{:else}
				<h2 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Projects</h2>
				<div class="space-y-2">
					{#each stores as store}
						<a
							href={`/dash/store/${store.code}`}
							class="flex items-center gap-4 bg-card border border-hairline rounded-xl px-5 py-4 transition-all duration-150 hover:border-ember/40 hover:bg-card/80 no-underline group"
						>
							{#if store.logo}
								<img src={store.logo} alt={store.name} class="h-10 w-10 rounded-lg object-cover bg-canvas flex-shrink-0" />
							{:else}
								<span class="h-10 w-10 flex items-center justify-center rounded-lg bg-ember/10 text-ember font-bold text-sm flex-shrink-0">
									{store.name.charAt(0).toUpperCase()}
								</span>
							{/if}
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="text-sm font-semibold text-ink truncate group-hover:text-ember transition-colors">{store.name}</h3>
									{#if !store.active}
										<span class="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-semibold flex-shrink-0">Oculta</span>
									{/if}
								</div>
								<p class="text-xs text-muted-soft truncate">@{store.slug}</p>
							</div>
							<div class="hidden sm:flex items-center gap-4 text-[11px] text-muted-soft flex-shrink-0">
								<span>{stats[store.id]?.products ?? 0} productos</span>
								<span>{stats[store.id]?.orders ?? 0} pedidos</span>
								<span>{stats[store.id]?.visits ?? 0} visitas</span>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<button
									onclick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(storeUrl(store.slug), '_blank', 'noopener,noreferrer'); }}
									class="p-2 rounded-lg text-muted hover:text-ink hover:bg-bone transition-colors cursor-pointer"
									aria-label="Ver tienda"
									title="Ver tienda"
								>
									<i class="ri-external-link-line text-sm"></i>
								</button>
								<button
									onclick={(e) => { e.preventDefault(); e.stopPropagation(); deleteTarget = store; }}
									class="p-2 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
									aria-label="Eliminar"
									title="Eliminar"
								>
									<i class="ri-delete-bin-6-line text-sm"></i>
								</button>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>

{#if mobileMenuOpen}
	<div class="fixed inset-0 z-50 lg:hidden" role="presentation">
		<button type="button" class="absolute inset-0 bg-black/60" onclick={() => (mobileMenuOpen = false)} aria-label="Cerrar"></button>
		<div class="absolute left-0 top-0 bottom-0 w-64 bg-canvas border-r border-hairline p-4 overflow-y-auto">
			<div class="flex items-center justify-between mb-6">
				<a href="/dash" class="flex items-center gap-2 no-underline" onclick={() => (mobileMenuOpen = false)}>
					<img src="/isotipo.png" alt="Tiendly" class="h-7 w-7 rounded-md" />
					<span class="font-black text-base text-ink">Tiendly</span>
				</a>
				<button onclick={() => (mobileMenuOpen = false)} class="p-1 text-muted hover:text-ink cursor-pointer">
					<i class="ri-close-line text-xl"></i>
				</button>
			</div>
			<nav class="space-y-1">
				<a href="/dash" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-ember/10 text-ember no-underline" onclick={() => (mobileMenuOpen = false)}>
					<i class="ri-store-2-fill text-lg"></i> Projects
				</a>
				<a href="/dash/profile" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-soft hover:text-ink hover:bg-bone transition-colors no-underline" onclick={() => (mobileMenuOpen = false)}>
					<i class="ri-user-settings-line text-lg"></i> Settings
				</a>
				<a href="/pricing" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-soft hover:text-ink hover:bg-bone transition-colors no-underline" onclick={() => (mobileMenuOpen = false)}>
					<i class="ri-vip-crown-line text-lg"></i> Planes
				</a>
			</nav>
			<div class="mt-6 pt-4 border-t border-hairline">
				<div class="px-3 py-2">
					<div class="flex items-center gap-2 mb-1">
						<span class="w-2 h-2 rounded-full {plan.id === 'free' ? 'bg-muted' : 'bg-ember'}"></span>
						<span class="text-sm font-semibold text-ink">{plan.name}</span>
					</div>
				</div>
				<a
					href="/dash/profile?tab=privacidad"
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-soft hover:text-ink hover:bg-bone transition-colors no-underline"
					onclick={() => (mobileMenuOpen = false)}
				>
					<img src={auth.profile?.avatar_url || undefined} alt="" class="h-6 w-6 rounded-full object-cover" />
					<span class="truncate text-body">{auth.profile?.name ?? auth.session?.user.email ?? ''}</span>
				</a>
			</div>
		</div>
	</div>
{/if}

{#if deleteTarget}
	<div class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" role="presentation">
		<button type="button" class="absolute inset-0 bg-black/60 cursor-default" onclick={() => (deleteTarget = null)} aria-label="Cerrar"></button>
		<div class="relative bg-card border border-hairline rounded-2xl w-full max-w-sm p-6 text-center">
			<div class="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center mx-auto mb-4">
				<i class="ri-delete-bin-6-line text-xl text-error"></i>
			</div>
			<h2 class="text-lg font-bold text-ink mb-1">Eliminar {deleteTarget.name}?</h2>
			<p class="text-sm text-muted mb-5">Se borrarán {stats[deleteTarget.id]?.products ?? 0} productos y {stats[deleteTarget.id]?.orders ?? 0} pedidos permanentemente.</p>
			{#if deleteError}
				<p class="text-xs text-error mb-4">{deleteError}</p>
			{/if}
			<div class="flex gap-3">
				<button onclick={() => (deleteTarget = null)} disabled={deleting} class="flex-1 px-4 py-2.5 border border-hairline text-body rounded-xl text-sm font-medium hover:bg-bone cursor-pointer disabled:opacity-50">Cancelar</button>
				<button onclick={confirmDelete} disabled={deleting} class="flex-1 inline-flex items-center justify-center gap-2 bg-error text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
					{#if deleting}<i class="ri-loader-4-line animate-spin"></i>{/if}
					{deleting ? 'Eliminando...' : 'Eliminar'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if upgradeOpen}
	<div class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" role="presentation">
		<button type="button" class="absolute inset-0 bg-black/60 cursor-default" onclick={() => (upgradeOpen = false)} aria-label="Cerrar"></button>
		<div class="relative bg-card border border-hairline rounded-2xl w-full max-w-3xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
			<button onclick={() => (upgradeOpen = false)} class="absolute top-4 right-4 text-muted hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
				<i class="ri-close-line text-xl"></i>
			</button>
			<h2 class="text-xl font-bold text-ink mb-1">Elige tu plan</h2>
			<p class="text-sm text-muted mb-6">Precios en USD</p>
			<div class="grid gap-4 sm:grid-cols-3">
				{#each PLANS as p}
					<div class={`border rounded-2xl p-5 flex flex-col ${p.id === plan.id ? 'border-ember border-2' : 'border-hairline'}`}>
						<div class="flex items-center justify-between mb-1">
							<h3 class="font-bold text-ink">{p.name}</h3>
							{#if p.id === plan.id}
								<span class="text-[10px] font-bold bg-ember/10 text-ember rounded-full px-2 py-0.5">Actual</span>
							{:else if p.id === 'business'}
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
							<a
								href={planWhatsAppUrl(p.name, 'monthly', auth.session?.user?.email ?? '—')}
								class="w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-4 py-3 rounded-xl text-sm font-semibold no-underline hover:bg-ember-active transition-colors"
							>
								<i class="ri-whatsapp-line"></i>
								Adquirir
							</a>
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
