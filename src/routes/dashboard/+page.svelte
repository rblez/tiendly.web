<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { ensureUniqueSlug, generateStoreCode, storeUrl } from '$lib/utils';
	import { PLAN_MAP } from '$lib/plans';
	import type { Json } from '$lib/database.types';
	import { Eye, ExternalLink, Package, Plus, ShoppingBag, Store as StoreIcon } from '@lucide/svelte';
	import type { Order, Product, Store } from '$lib/types';

	type StoreStats = Record<string, { products: number; orders: number; visits: number }>;

	// Caché de la sesión: evita skeleton y salto de layout al volver a /dashboard
	let cachedStores: Store[] = [];
	let cachedStats: StoreStats = {};

	let stores = $state<Store[]>([]);
	let stats = $state<StoreStats>({});
	let loading = $state(true);
	let upgradeOpen = $state(false);
	let deleteTarget = $state<Store | null>(null);
	let deleting = $state(false);
	let loadError = $state('');
	let deleteError = $state('');
	let menuOpenId = $state<string | null>(null);
	let copiedId = $state<string | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | null = null;
	let duplicatingId = $state<string | null>(null);
	let duplicating = $state(false);
	let duplicateError = $state('');

	async function copyStoreLink(store: Store) {
		const url = storeUrl(store.slug);
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = url;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
		}
		copiedId = store.id;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copiedId = null), 2000);
	}

	async function shareStore(store: Store) {
		const url = storeUrl(store.slug);
		if (navigator.share) {
			try {
				await navigator.share({ title: `Tiendly | ${store.name}`, url });
				menuOpenId = null;
				return;
			} catch {
				/* el usuario canceló o el navegador no soporta: se copia el enlace */
			}
		}
		await copyStoreLink(store);
	}

	async function duplicateStore(store: Store) {
		if (duplicating || !auth.session) return;
		if (atLimit) {
			menuOpenId = null;
			upgradeOpen = true;
			return;
		}
		duplicatingId = store.id;
		duplicating = true;
		duplicateError = '';
		try {
			const slug = await ensureUniqueSlug(`${store.slug}-copia`);
			const { data: newStore, error: storeErr } = await supabase
				.from('stores')
				.insert({
					code: generateStoreCode(8),
					slug,
					owner_id: auth.session.user.id,
					name: `${store.name} (copia)`,
					description: store.description,
					logo: store.logo,
					banner: store.banner,
					whatsapp: store.whatsapp,
					theme_color: store.theme_color,
					active: store.active,
					action: store.action === 'whatsapp' ? 'whatsapp' : 'sin_contactar',
					currency: store.currency ?? 'CUP',
					exchange_rate: store.exchange_rate ?? null,
					extra_links: store.extra_links ?? [],
					location: store.location ?? null,
					schedule: store.schedule ?? null,
					social: (store.social ?? {}) as Json,
					visits: 0,
				})
				.select()
				.single();
			if (storeErr) throw new Error(storeErr.message);

			const { data: srcProducts } = await supabase.from('products').select('*').eq('store_id', store.id);
			const rows = (srcProducts ?? []).map((p) => ({
				store_id: newStore.id,
				name: p.name,
				description: p.description,
				image: p.image,
				images: p.images,
				price: p.price,
				currency: p.currency,
				category: p.category,
				variants: p.variants,
				agotado: p.agotado,
				bajo_pedido: p.bajo_pedido,
				active: p.active,
				position: p.position,
			}));
			if (rows.length > 0) {
				const { error: prodErr } = await supabase.from('products').insert(rows);
				if (prodErr) throw new Error(prodErr.message);
			}
			await loadStores();
		} catch (e) {
			duplicateError = e instanceof Error ? e.message : 'No se pudo duplicar la tienda.';
		} finally {
			duplicatingId = null;
			duplicating = false;
			menuOpenId = null;
		}
	}

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
		cachedStores = [...stores];
		deleteTarget = null;
	}

	async function toggleActive(store: Store) {
		const next = !store.active;
		stores = stores.map((s) => (s.id === store.id ? { ...s, active: next } : s));
		cachedStores = [...stores];
		const { error } = await supabase.from('stores').update({ active: next }).eq('id', store.id);
		if (error) {
			stores = stores.map((s) => (s.id === store.id ? { ...s, active: !next } : s));
			cachedStores = [...stores];
		}
	}

	const plan = PLAN_MAP[auth.plan] ?? PLAN_MAP.free;
	const atLimit = $derived(stores.length >= (plan.limitStores ?? Infinity));
	const totalProducts = $derived(Object.values(stats).reduce((sum, item) => sum + item.products, 0));
	const totalOrders = $derived(Object.values(stats).reduce((sum, item) => sum + item.orders, 0));
	const totalVisits = $derived(Object.values(stats).reduce((sum, item) => sum + item.visits, 0));
	const hiddenStores = $derived(stores.filter((store) => !store.active).length);

	async function loadStores() {
		loading = cachedStores.length === 0;
		loadError = '';
		try {
			const { data: storeRowsRaw, error: storeErr } = await supabase
				.from('stores')
				.select('*')
				.eq('owner_id', auth.session!.user.id)
				.order('created_at', { ascending: false });
			if (storeErr) throw storeErr;
			const storeRows = (storeRowsRaw as unknown as Store[] | null) ?? [];
			stores = storeRows;

			const acc: StoreStats = {};
			for (const s of storeRows) acc[s.id] = { products: 0, orders: 0, visits: 0 };

			if (storeRows.length > 0) {
				const storeIds = storeRows.map((s) => s.id);
				const [productsRes, ordersRes, visitRes] = await Promise.all([
					supabase.from('products').select('store_id').in('store_id', storeIds).eq('active', true).limit(5000),
					supabase.from('orders').select('store_id').in('store_id', storeIds).limit(5000),
					supabase.from('store_visits').select('store_id, visits').in('store_id', storeIds).limit(5000),
				]);
				for (const p of productsRes.data ?? []) {
					const row = p as { store_id: string };
					if (acc[row.store_id]) acc[row.store_id].products += 1;
				}
				for (const o of ordersRes.data ?? []) {
					const row = o as { store_id: string };
					if (acc[row.store_id]) acc[row.store_id].orders += 1;
				}
				for (const v of visitRes.data ?? []) {
					const row = v as { store_id: string; visits: number };
					if (acc[row.store_id]) acc[row.store_id].visits += row.visits;
				}
			}
			stats = acc;
			cachedStores = storeRows;
			cachedStats = acc;
		} catch {
			loadError = 'No se pudieron cargar tus tiendas. Inténtalo de nuevo.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!auth.ready || !auth.session) return;
		if (cachedStores.length > 0 && stores.length === 0) {
			stores = cachedStores;
			stats = cachedStats;
			loading = false;
		}
		loadStores();
	});

	// Reanuda al volver sin bloquear: debounced, sin retrigger infinito
	onMount(() => {
		let lastRefresh = 0;
		let pending = false;
		const COOLDOWN = 15000;
		const doRefresh = async () => {
			if (pending || !auth.session) return;
			if (Date.now() - lastRefresh < COOLDOWN) return;
			pending = true;
			lastRefresh = Date.now();
			try {
				await loadStores();
			} finally {
				pending = false;
			}
		};
		const onVisible = () => {
			if (document.visibilityState === 'visible') void doRefresh();
		};
		const onFocus = () => void doRefresh();
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('focus', onFocus);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('focus', onFocus);
		};
	});
</script>

<svelte:head>
	<title>Inicio | Tiendly</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 pb-7 sm:pb-10">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
		<div class="pt-1">
<h1 class="text-2xl sm:text-3xl font-bold text-ink">Qué bueno verte, {auth.profile?.name ?? 'de nuevo'}</h1>
				<p class="text-sm text-muted mt-1">Una vista clara de tus tiendas y las prioridades de hoy.</p>
		</div>
		<div class="flex items-center gap-2">
			{#if atLimit}
				<button
					onclick={() => (upgradeOpen = true)}
					class="btn btn-3d btn-md w-full sm:w-auto cursor-pointer"
				>
					<i class="ri-add-line"></i>
					Nueva tienda
				</button>
			{:else}
				<a
					href="/wizard"
					class="btn btn-3d btn-md w-full sm:w-auto no-underline"
				>
					<i class="ri-add-line"></i>
					Nueva tienda
				</a>
			{/if}
		</div>
		</div>

		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
			<div class="acrylic border border-hairline rounded-card p-4"><StoreIcon size={20} class="text-ember mb-3" aria-hidden="true" /><p class="text-2xl font-bold text-ink">{stores.length}</p><p class="text-xs text-muted mt-1">Tiendas</p></div>
			<div class="acrylic border border-hairline rounded-card p-4"><Package size={20} class="text-ember mb-3" aria-hidden="true" /><p class="text-2xl font-bold text-ink">{totalProducts}</p><p class="text-xs text-muted mt-1">Productos activos</p></div>
			<div class="acrylic border border-hairline rounded-card p-4"><ShoppingBag size={20} class="text-ember mb-3" aria-hidden="true" /><p class="text-2xl font-bold text-ink">{totalOrders}</p><p class="text-xs text-muted mt-1">Pedidos</p></div>
			<div class="acrylic border border-hairline rounded-card p-4"><Eye size={20} class="text-ember mb-3" aria-hidden="true" /><p class="text-2xl font-bold text-ink">{totalVisits}</p><p class="text-xs text-muted mt-1">Visitas</p></div>
		</div>
		<div class="flex flex-wrap gap-2 mb-8">
			<a href="/wizard" class="btn btn-3d btn-md no-underline"><Plus size={17} aria-hidden="true" /> Crear tienda</a>
			{#if stores[0]}<a href={storeUrl(stores[0].slug)} target="_blank" rel="noreferrer" class="btn btn-secondary btn-md no-underline"><ExternalLink size={17} aria-hidden="true" /> Ver tienda pública</a>{/if}
			{#if hiddenStores > 0}<span class="inline-flex items-center rounded-full border border-ember/20 bg-ember/10 px-3 py-2 text-xs font-semibold text-ember">{hiddenStores} {hiddenStores === 1 ? 'tienda oculta' : 'tiendas ocultas'}</span>{/if}
		</div>

		{#if atLimit}
		<div
			class="w-full flex items-start justify-between gap-4 bg-gradient-to-r from-ember/15 via-ember/5 to-transparent border border-ember/30 rounded-card p-5 mb-8"
		>
			<div class="flex items-start gap-4 min-w-0">
				<div class="text-left">
					<p class="font-bold text-ink">Estás en el plan Gratis</p>
					<p class="text-sm text-body mt-0.5">Incluye {plan.limitStores} tienda y hasta {plan.limitProducts} productos por tienda. Puedes duplicar, eliminar o editar tus tiendas desde el menú ⋮.</p>
				</div>
			</div>
		</div>
	{/if}

	{#if loadError}
		<div class="flex items-center gap-2.5 bg-error/10 border border-error/30 text-error rounded-btn px-4 py-3 mb-6 text-sm">
			<i class="ri-error-warning-line flex-shrink-0"></i>
			<p>{loadError}</p>
			<button
				onclick={() => loadStores()}
				class="ml-auto text-xs font-semibold underline underline-offset-2 cursor-pointer"
			>
				Reintentar
			</button>
		</div>
	{/if}

	{#if duplicateError}
		<div class="flex items-center gap-2.5 bg-error/10 border border-error/30 text-error rounded-btn px-4 py-3 mb-6 text-sm">
			<i class="ri-error-warning-line flex-shrink-0"></i>
			<p>{duplicateError}</p>
			<button onclick={() => (duplicateError = '')} class="ml-auto text-xs font-semibold underline underline-offset-2 cursor-pointer">
				Cerrar
			</button>
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-24">
			<div class="flex flex-col items-center gap-3">
				<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
				<p class="text-sm text-muted">Cargando tus tiendas...</p>
			</div>
		</div>
	{:else if stores.length === 0}
		<div class="empty-state">
			<div class="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
				<i class="ri-store-2-line text-3xl text-ember"></i>
			</div>
			<h2 class="text-xl font-bold text-ink mb-2">Aún no tienes tiendas</h2>
			<p class="text-body mb-6">Crea tu primera tienda gratis en menos de 5 minutos.</p>
			<a
				href="/wizard"
				class="btn btn-3d btn-md no-underline"
			>
				Crear mi tienda
			</a>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
			{#each stores as store}
				<a href={`/dashboard/s/${store.code}`} class="relative acrylic bg-card/90 border border-hairline rounded-card transition-all duration-200 hover:border-ember/50 hover:shadow-lg hover:shadow-ink/5 hover:-translate-y-0.5 no-underline block group">
					<div class="p-5 sm:p-6">
						<div class="flex items-start gap-3 pr-10">
							<div class="h-12 w-12 rounded-xl overflow-hidden bg-canvas border border-hairline flex-shrink-0">
								{#if store.logo}
									<img src={store.logo} alt={store.name} class="h-full w-full object-cover" loading="lazy" />
								{:else}
									<span class="h-full w-full flex items-center justify-center bg-ember text-canvas font-black text-lg select-none">
										{store.name.charAt(0).toUpperCase()}
									</span>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="font-bold text-ink truncate leading-tight">{store.name}</h3>
								<p class="text-xs text-muted truncate mt-0.5">@{store.slug}</p>
								<p class="text-[11px] text-muted-soft mt-1.5 inline-flex items-center gap-1.5">
									<span class={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-success' : 'bg-muted-soft'}`}></span>
									{store.active ? 'Visible' : 'Oculta'}
								</p>
							</div>
						</div>
						<div class="absolute top-4 right-4 z-30">
							<button
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									menuOpenId = menuOpenId === store.id ? null : store.id;
								}}
								class="h-8 w-8 flex items-center justify-center rounded-full bg-bone text-muted hover:text-ink hover:bg-bone/60 transition-colors cursor-pointer"
								aria-label={`Opciones de ${store.name}`}
								aria-expanded={menuOpenId === store.id}
							>
								<i class="ri-more-2-fill"></i>
							</button>
							{#if menuOpenId === store.id}
								<button
									type="button"
									class="fixed inset-0 z-40 cursor-default"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										menuOpenId = null;
									}}
									aria-label="Cerrar menú"
								></button>
								<div class="absolute right-0 top-full mt-2 z-50 w-56 bg-card border border-hairline rounded-btn shadow-xl overflow-hidden">
									<button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											copyStoreLink(store);
										}}
										class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-body hover:bg-bone transition-colors cursor-pointer text-left"
									>
										<i class="ri-link text-muted-soft"></i>
										<span class="flex-1">Copiar enlace</span>
										{#if copiedId === store.id}
											<span class="text-[11px] font-bold text-ember inline-flex items-center gap-1">
												<i class="ri-check-line"></i>
												Copiado
											</span>
										{/if}
									</button>
									<button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											shareStore(store);
										}}
										class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-body hover:bg-bone transition-colors cursor-pointer text-left"
									>
										<i class="ri-share-forward-line text-muted-soft"></i>
										Compartir
									</button>
									<button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											duplicateStore(store);
										}}
										disabled={duplicatingId === store.id}
										class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-body hover:bg-bone transition-colors cursor-pointer text-left disabled:opacity-50"
									>
										<i class="ri-file-copy-line text-muted-soft"></i>
										{duplicatingId === store.id ? 'Duplicando...' : 'Duplicar tienda'}
									</button>
									<div class="border-t border-hairline"></div>
									<button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											menuOpenId = null;
											deleteTarget = store;
										}}
										class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors cursor-pointer text-left"
									>
										<i class="ri-delete-bin-6-line"></i>
										Eliminar
									</button>
								</div>
							{/if}
						</div>
						{#if store.description}
							<p class="text-xs text-body line-clamp-2 mt-4">{store.description}</p>
						{/if}
						<div class="grid grid-cols-3 bg-canvas border border-hairline rounded-btn divide-x divide-hairline mt-4 overflow-hidden">
							<div class="px-2 py-3 text-center">
								<p class="text-base font-bold text-ink tabular-nums leading-none">{stats[store.id]?.products ?? 0}</p>
								<p class="text-[10px] text-muted mt-1 uppercase tracking-wider">Productos</p>
							</div>
							<div class="px-2 py-3 text-center">
								<p class="text-base font-bold text-ink tabular-nums leading-none">{stats[store.id]?.orders ?? 0}</p>
								<p class="text-[10px] text-muted mt-1 uppercase tracking-wider">Pedidos</p>
							</div>
							<div class="px-2 py-3 text-center">
								<p class="text-base font-bold text-ink tabular-nums leading-none">{stats[store.id]?.visits ?? 0}</p>
								<p class="text-[10px] text-muted mt-1 uppercase tracking-wider">Visitas</p>
							</div>
						</div>
					</div>
					<div class="border-t border-hairline px-5 sm:px-6 py-3 flex items-center justify-between">
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								toggleActive(store);
							}}
							class="inline-flex items-center gap-2.5 cursor-pointer"
							title={store.active ? 'Ocultar tienda' : 'Mostrar tienda'}
							aria-label={store.active ? 'Ocultar tienda' : 'Mostrar tienda'}
						>
							<span class={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${store.active ? 'bg-ember' : 'bg-bone border border-hairline'}`}>
								<span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all {store.active ? 'left-[18px]' : 'left-0.5'}"></span>
							</span>
							<span class={`text-xs font-medium ${store.active ? 'text-ink' : 'text-muted-soft'}`}>{store.active ? 'Visible' : 'Oculta'}</span>
						</button>
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								window.open(storeUrl(store.slug), '_blank', 'noopener,noreferrer');
							}}
							class="inline-flex items-center px-3 py-1.5 rounded-btn bg-bone text-body hover:text-ember hover:bg-ember/10 text-xs font-medium transition-colors cursor-pointer"
						>
							Ver
						</button>
					</div>
				</a>
			{/each}
		</div>
	{/if}

	{#if deleteTarget}
		<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="presentation">
			<button type="button" class="absolute inset-0 bg-black/60 cursor-default" onclick={() => (deleteTarget = null)} aria-label="Cerrar"></button>
			<div class="relative bg-card border border-hairline rounded-card w-full max-w-sm p-6 sm:p-8 text-center">
				<div class="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
					<i class="ri-delete-bin-6-line text-2xl text-error"></i>
				</div>
				<h2 class="text-lg font-bold text-ink mb-1">¿Eliminar {deleteTarget.name}?</h2>
				<p class="text-sm text-muted mb-6">
					Se borrarán permanentemente sus {stats[deleteTarget.id]?.products ?? 0} productos y {stats[deleteTarget.id]?.orders ?? 0} pedidos. Esta acción no se puede deshacer.
				</p>
				{#if deleteError}
					<p class="text-xs text-error mb-4">{deleteError}</p>
				{/if}
				<div class="flex flex-col sm:flex-row gap-3">
					<button
						onclick={() => (deleteTarget = null)}
						disabled={deleting}
						class="btn btn-secondary btn-md flex-1 disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						onclick={confirmDelete}
						disabled={deleting}
						class="flex-1 inline-flex items-center justify-center gap-2 bg-error text-white px-5 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-50"
					>
						{#if deleting}
							<i class="ri-loader-4-line animate-spin"></i>
						{/if}
						{deleting ? 'Eliminando...' : 'Eliminar'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if upgradeOpen}		<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="presentation">
			<button type="button" class="absolute inset-0 bg-black/60 cursor-default" onclick={() => (upgradeOpen = false)} aria-label="Cerrar"></button>
			<div class="relative bg-card border border-hairline rounded-card w-full max-w-md p-5 sm:p-8">
				<button onclick={() => (upgradeOpen = false)} class="absolute top-4 right-4 text-muted hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
					<i class="ri-close-line text-xl"></i>
				</button>
				<div class="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mb-4">
					<i class="ri-store-2-line text-2xl text-ember"></i>
				</div>
				<h2 class="text-xl font-bold text-ink mb-1">Límite del plan Gratis</h2>
				<p class="text-sm text-body">
					El plan Gratis incluye {plan.limitStores === Infinity ? 'tiendas ilimitadas' : `${plan.limitStores} ${plan.limitStores === 1 ? 'tienda' : 'tiendas'}`} y hasta {plan.limitProducts === Infinity ? 'productos ilimitados' : `${plan.limitProducts} productos`} por tienda.
				</p>
				<button
					type="button"
					onclick={() => (upgradeOpen = false)}
					class="btn btn-3d btn-md w-full mt-6 cursor-pointer"
				>
					Entendido
				</button>
			</div>
		</div>
	{/if}
</section>
