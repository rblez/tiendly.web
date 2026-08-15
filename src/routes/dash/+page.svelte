<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { ensureUniqueSlug, generateStoreCode, storeUrl } from '$lib/utils';
	import { PLAN_MAP, PLANS, planWhatsAppUrl } from '$lib/plans';
	import type { Json } from '$lib/database.types';
	import type { Order, Product, Store } from '$lib/types';

	type StoreStats = Record<string, { products: number; orders: number; visits: number }>;

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

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
	}

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
					action: store.action ?? 'comprar',
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
		deleteTarget = null;
	}

	async function toggleActive(store: Store) {
		const next = !store.active;
		stores = stores.map((s) => (s.id === store.id ? { ...s, active: next } : s));
		const { error } = await supabase.from('stores').update({ active: next }).eq('id', store.id);
		if (error) {
			stores = stores.map((s) => (s.id === store.id ? { ...s, active: !next } : s));
		}
	}

	const plan = PLAN_MAP[auth.plan] ?? PLAN_MAP.free;
	const atLimit = $derived(stores.length >= (plan.limitStores ?? Infinity));

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
			loadError = 'No se pudieron cargar tus tiendas. Inténtalo de nuevo.';
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
					class="inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer"
				>
					Nueva tienda
				</button>
			{:else}
				<a
					href="/wizard"
					class="inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline"
				>
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
				<div class="text-left">
					<p class="font-bold text-ink">Estás en el plan Gratis</p>
					<p class="text-sm text-body mt-0.5">Incluye 1 tienda y 10 productos. Actualiza a Estándar o Negocios para más tiendas y productos.</p>
				</div>
			</div>
			<span class="text-sm font-medium text-ember flex-shrink-0 mt-1">
				Mejorar plan
			</span>
		</button>
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
				href="/wizard"
				class="inline-flex items-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline"
			>
				Crear mi tienda
			</a>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
			{#each stores as store}
				<a href={`/dash/store/${store.code}`} class="relative bg-card border border-hairline rounded-card p-6 sm:p-7 transition-all duration-200 hover:border-ember/50 hover:shadow-sm no-underline block group">
					<div class="flex items-center gap-3 mb-4 pr-10">
						{#if store.logo}
							<img src={store.logo} alt={store.name} class="h-12 w-12 object-cover rounded-lg bg-canvas" />
						{:else}
							<span class="h-12 w-12 flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-lg select-none">
								{store.name.charAt(0).toUpperCase()}
							</span>
						{/if}
						<div class="min-w-0">
							<h3 class="font-bold text-ink truncate">{store.name}</h3>
							<p class="text-xs text-muted truncate">@{store.slug}</p>
						</div>
						{#if !store.active}
							<span class="ml-auto inline-flex items-center px-2.5 py-1 rounded-full bg-error/10 text-error text-[11px] flex-shrink-0">
								Oculta
							</span>
						{/if}
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
						<p class="text-xs text-body line-clamp-2 mb-4">{store.description}</p>
					{/if}
					<div class="grid grid-cols-3 gap-3 mb-5">
						<div class="bg-canvas rounded-btn px-3 py-3 text-center">
							<p class="text-base font-bold text-ink tabular-nums">{stats[store.id]?.products ?? 0}</p>
							<p class="text-[10px] text-muted">Productos</p>
						</div>
						<div class="bg-canvas rounded-btn px-3 py-3 text-center">
							<p class="text-base font-bold text-ink tabular-nums">{stats[store.id]?.orders ?? 0}</p>
							<p class="text-[10px] text-muted">Pedidos</p>
						</div>
						<div class="bg-canvas rounded-btn px-3 py-3 text-center">
							<p class="text-base font-bold text-ink tabular-nums">{stats[store.id]?.visits ?? 0}</p>
							<p class="text-[10px] text-muted">Visitas</p>
						</div>
					</div>
					<div class="flex items-center gap-2 text-xs">
						<span class="inline-flex items-center px-4 py-1.5 rounded-full bg-ember text-white font-medium">
							Gestionar
						</span>
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								toggleActive(store);
							}}
							class="relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0
								{store.active ? 'bg-ember' : 'bg-bone border border-hairline'}"
							title={store.active ? 'Apagar tienda' : 'Encender tienda'}
							aria-label={store.active ? 'Ocultar tienda' : 'Mostrar tienda'}
						>
							<span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all {store.active ? 'left-[22px]' : 'left-0.5'}"></span>
						</button>
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								window.open(storeUrl(store.slug), '_blank', 'noopener,noreferrer');
							}}
							class="inline-flex items-center px-3 py-1.5 rounded-full bg-bone text-body hover:text-ember transition-colors cursor-pointer"
						>
							Ver
						</button>
					</div>
					<p class="text-[11px] text-muted-soft mt-4 flex items-center gap-1">
						<i class="ri-time-line text-[10px]"></i>
						Creada el {fmtDate(store.created_at)}
					</p>
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
						class="flex-1 px-5 py-3 border border-hairline text-body rounded-btn text-sm font-medium transition-colors hover:bg-bone cursor-pointer disabled:opacity-50"
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
			<div class="relative bg-card border border-hairline rounded-card w-full max-w-3xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
				<button onclick={() => (upgradeOpen = false)} class="absolute top-4 right-4 text-muted hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
					<i class="ri-close-line text-xl"></i>
				</button>
				<h2 class="text-xl font-bold text-ink mb-1">Elige tu plan</h2>
				<p class="text-sm text-muted mb-6">Precios en USD</p>

				<div class="grid gap-4 sm:grid-cols-3">
					{#each PLANS as p}
						<div class={`border rounded-card p-5 flex flex-col ${p.id === plan.id ? 'border-ember border-2' : 'border-hairline'}`}>
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
									class="w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-4 py-3 rounded-btn text-sm font-medium no-underline opacity-90 hover:opacity-100 transition-opacity"
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
</section>