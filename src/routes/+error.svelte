<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { supabase } from '$lib/supabase/client';
	import { SITE_URL } from '$lib/utils';
	import type { Store } from '$lib/types';

	type StoreRow = Pick<Store, 'id' | 'name' | 'slug' | 'logo'>;

	const pathname = $derived($page.url.pathname);
	const notFound = $derived($page.status === 404);

	const slugCandidate = $derived.by(() => {
		const segs = pathname.split('/').filter(Boolean);
		for (let i = 0; i < segs.length; i++) {
			if (segs[i] === '@' && segs[i + 1]) return segs[i + 1];
			if (segs[i].startsWith('@') && segs[i].length > 1) return segs[i].slice(1);
		}
		if (segs[0] === 't' && segs[1]) return segs[1];
		return null;
	});

	let suggested = $state<StoreRow | null>(null);
	let unavailableSlug = $state<string | null>(null);
	let loadingSuggestion = $state(false);

	$effect(() => {
		const slug = slugCandidate;
		if (!slug) {
			suggested = null;
			unavailableSlug = null;
			return;
		}
		let cancelled = false;
		loadingSuggestion = true;
		supabase
			.from('stores')
			.select('id, name, slug, logo, active, owner_id')
			.eq('slug', slug)
			.limit(1)
			.then(
				({ data }) => {
					if (cancelled) return;
					const row = data?.[0];
					if (row && row.active && row.owner_id) {
						suggested = row as unknown as StoreRow;
						unavailableSlug = null;
					} else if (row) {
						suggested = null;
						unavailableSlug = slug;
					} else {
						suggested = null;
						unavailableSlug = null;
					}
					loadingSuggestion = false;
				},
				() => {
					if (!cancelled) loadingSuggestion = false;
				},
			);
		return () => {
			cancelled = true;
		};
	});

	let query = $state('');
	let results = $state<StoreRow[]>([]);
	let searching = $state(false);
	let activeIndex = $state(-1);

	const recentStores = $state<StoreRow[]>([]);
	let popular = $state<StoreRow[]>([]);
	let loadedPopular = $state(false);

	$effect(() => {
		try {
			const stored = JSON.parse(localStorage.getItem('tiendly-recent-stores') ?? '[]') as StoreRow[];
			recentStores.splice(0, recentStores.length, ...stored.slice(0, 6));
		} catch {
			recentStores.splice(0, recentStores.length);
		}
	});

	$effect(() => {
		if (loadedPopular) return;
		const from = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
		let cancelled = false;
		supabase
			.from('store_visits')
			.select('store_id, visits')
			.gte('visit_date', from)
			.limit(1500)
			.then(
				async ({ data, error }) => {
					if (cancelled || error) return;
					const counts = new Map<string, number>();
					for (const v of data ?? []) counts.set(v.store_id, (counts.get(v.store_id) ?? 0) + v.visits);
					const top = [...counts.entries()]
						.filter(([, c]) => c > 0)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map(([id]) => id);
					if (top.length === 0) return;
					const { data: stores } = await supabase
						.from('stores')
						.select('id, name, slug, logo')
						.in('id', top)
						.eq('active', true)
						.not('owner_id', 'is', null);
					if (!cancelled) {
						const byId = new Map((stores ?? []).map((s) => [s.id, s as StoreRow]));
						popular = [...top.map((id) => byId.get(id)).filter((s): s is StoreRow => !!s)];
						loadedPopular = true;
					}
				},
				() => {
					if (!cancelled) loadedPopular = true;
				},
			);
		return () => {
			cancelled = true;
		};
	});

	function score(q: string, slug: string, name: string): number {
		const s = slug.toLowerCase();
		const n = name.toLowerCase();
		let v = 0;
		if (s === q) v += 100;
		if (n === q) v += 80;
		if (s.startsWith(q)) v += 30;
		if (n.startsWith(q)) v += 20;
		if (s.includes(q)) v += 10;
		if (n.includes(q)) v += 8;
		return v;
	}

	$effect(() => {
		const q = query.trim().toLowerCase();
		if (!q) {
			results = [];
			searching = false;
			activeIndex = -1;
			return;
		}
		searching = true;
		const timer = setTimeout(() => {
			supabase
				.from('stores')
				.select('id, name, slug, logo')
				.eq('active', true)
				.not('owner_id', 'is', null)
				.or(`slug.ilike.%${q}%,name.ilike.%${q}%`)
				.limit(30)
				.then(
					({ data }) => {
						const rows = (data as StoreRow[] | null) ?? [];
						results = rows
							.map((r) => ({ r, s: score(q, r.slug, r.name) }))
							.filter((x) => x.s > 0)
							.sort((a, b) => b.s - a.s)
							.map((x) => x.r)
							.slice(0, 6);
						searching = false;
						activeIndex = results.length > 0 ? 0 : -1;
					},
					() => {
						results = [];
						searching = false;
						activeIndex = -1;
					},
				);
		}, 200);
		return () => clearTimeout(timer);
	});

	const browseItems = $derived(query.trim() ? results : recentStores.length > 0 ? recentStores : popular);
	const browseLabel = $derived(query.trim() ? 'Resultados' : recentStores.length > 0 ? 'Tus tiendas recientes' : 'Tiendas populares');

	function openStore(item: StoreRow | null) {
		if (item) goto(`/@${item.slug}`);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = (activeIndex + 1) % browseItems.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = (activeIndex - 1 + browseItems.length) % browseItems.length;
		} else if (e.key === 'Enter' && activeIndex >= 0 && browseItems[activeIndex]) {
			e.preventDefault();
			openStore(browseItems[activeIndex]);
		} else if (e.key === 'Escape') {
			query = '';
		}
	}

	function goBack() {
		if (history.length > 1) history.back();
		else goto('/');
	}
</script>

<svelte:head>
	<title>Tiendly · Página no encontrada</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="canonical" href={SITE_URL} />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<MarketingNav />

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
	<div class="text-center">
		<img src="/tiendly-logo-completo.png" alt="Tiendly" class="h-10 object-contain mx-auto mb-8" />
		<p class="text-6xl sm:text-7xl font-black tracking-tighter text-ink">{notFound ? '404' : 'Error'}</p>
		<h1 class="text-xl sm:text-2xl font-bold text-ink mt-3 mb-2">
			{notFound ? 'Página no encontrada' : 'Algo salió mal'}
		</h1>
		<p class="text-body max-w-md mx-auto mb-8 leading-relaxed">
			{notFound
				? 'La página que buscas no existe o fue movida. Puede que el enlace esté mal escrito o que la tienda haya cambiado.'
				: ($page.error?.message ?? 'Algo salió mal. Intenta de nuevo en unos minutos.')}
		</p>

		{#if loadingSuggestion}
			<div class="w-full max-w-sm bg-card border border-hairline rounded-card p-4 animate-pulse mx-auto mb-6">
				<div class="h-5 bg-bone rounded w-1/2 mb-3"></div>
				<div class="h-4 bg-bone rounded w-2/3"></div>
			</div>
		{:else if suggested}
			<div class="w-full max-w-sm bg-card border border-hairline rounded-card p-4 text-left mx-auto mb-6">
				<p class="text-xs font-medium text-muted mb-3">Quizás buscabas esta tienda</p>
				<div class="flex items-center gap-3">
					{#if suggested.logo}
						<img src={suggested.logo} alt={suggested.name} class="h-11 w-11 object-cover rounded-lg bg-canvas" />
					{:else}
						<span class="h-11 w-11 flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-lg select-none">
							{suggested.name.charAt(0).toUpperCase()}
						</span>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="font-bold text-ink truncate">{suggested.name}</p>
						<p class="text-xs text-muted truncate">@{suggested.slug}</p>
					</div>
					<a
						href={`/@${suggested.slug}`}
						class="inline-flex items-center bg-ember text-white px-4 py-2 rounded-[12px] text-sm font-medium hover:bg-ember-active transition-colors no-underline flex-shrink-0"
					>
						Ir
					</a>
				</div>
			</div>
		{:else if unavailableSlug}
			<div class="w-full max-w-sm bg-card border border-hairline rounded-card p-4 text-left mx-auto mb-6">
				<p class="text-sm text-muted">
					La tienda <span class="font-semibold text-ink">@{unavailableSlug}</span> no está disponible ahora mismo.
				</p>
			</div>
		{/if}

		<div class="w-full max-w-sm mx-auto mb-8">
			<input
				type="text"
				bind:value={query}
				placeholder="Buscar una tienda..."
				role="combobox"
				aria-label="Buscar una tienda"
				aria-autocomplete="list"
				aria-expanded={browseItems.length > 0}
				aria-controls="store-list"
				aria-activedescendant={activeIndex >= 0 ? `store-opt-${activeIndex}` : undefined}
				class="w-full px-4 py-3 bg-card border border-hairline rounded-[14px] text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-shadow"
			/>

			{#if query.trim() && searching}
				<p class="mt-3 text-xs text-muted">Buscando...</p>
			{:else if browseItems.length > 0}
				<div id="store-list" role="listbox" aria-label={browseLabel} class="mt-2 bg-card border border-hairline rounded-card overflow-hidden text-left">
					<p class="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-soft">{browseLabel}</p>
					{#each browseItems as r, i}
						<a
							id={`store-opt-${i}`}
							role="option"
							aria-selected={activeIndex === i}
							href={`/@${r.slug}`}
							class="flex items-center gap-3 px-4 py-3 no-underline hover:bg-bone transition-colors border-t border-hairline {activeIndex === i ? 'bg-bone' : ''}"
							onmouseenter={() => (activeIndex = i)}
						>
							{#if r.logo}
								<img src={r.logo} alt={r.name} class="h-9 w-9 object-cover rounded-lg bg-canvas" />
							{:else}
								<span class="h-9 w-9 flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-sm select-none">
									{r.name.charAt(0).toUpperCase()}
								</span>
							{/if}
							<span class="min-w-0">
								<span class="block font-medium text-ink text-sm truncate">{r.name}</span>
								<span class="block text-xs text-muted truncate">@{r.slug}</span>
							</span>
						</a>
					{/each}
				</div>
			{:else if query.trim() && !searching}
				<p class="mt-3 text-xs text-muted">Sin resultados para "{query.trim()}".</p>
			{/if}
		</div>

		<div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
			<a
				href="/wizard"
				class="inline-flex items-center justify-center bg-ember text-white px-8 py-3 rounded-[14px] text-sm font-bold hover:bg-ember-active transition-colors no-underline w-full sm:w-auto"
			>
				Crea tu tienda gratis
			</a>
			<a
				href="/tiendas"
				class="inline-flex items-center justify-center bg-ink text-canvas px-8 py-3 rounded-[14px] text-sm font-semibold hover:opacity-85 transition-opacity no-underline w-full sm:w-auto"
			>
				Explorar tiendas
			</a>
			<a
				href="/"
				class="inline-flex items-center justify-center border border-hairline bg-card text-body px-8 py-3 rounded-[14px] text-sm font-medium hover:bg-bone transition-colors no-underline w-full sm:w-auto"
			>
				Volver al inicio
			</a>
		</div>
	</div>
</section>

<Footer />