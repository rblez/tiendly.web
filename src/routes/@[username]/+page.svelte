<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import SkeletonCard from '$lib/components/SkeletonCard.svelte';
	import { supabase } from '$lib/supabase/client';
	import { filters, type SortOrder } from '$lib/stores/filters.svelte';
	import type { Product, Store } from '$lib/types';

	let { data }: { data: { store: Store; products: Product[] } } = $props();

	let loaded = $state(false);
	let store = $state(data.store);
	let products = $state<Product[]>(data.products);

	function syncFiltersFromUrl() {
		const p = new URLSearchParams(window.location.search);
		filters.setSearchQuery(p.get('q') ?? '');
		filters.setCategory(p.get('cat'));
		const o = p.get('orden');
		filters.setSortOrder(o === 'precio-asc' || o === 'precio-desc' || o === 'nuevos' ? o : 'relevancia');
	}

	$effect(() => {
		filters.searchQuery;
		filters.selectedCategory;
		filters.sortOrder;
		const p = new URLSearchParams();
		if (filters.searchQuery) p.set('q', filters.searchQuery);
		if (filters.selectedCategory) p.set('cat', filters.selectedCategory);
		if (filters.sortOrder !== 'relevancia') p.set('orden', filters.sortOrder);
		const qs = p.toString();
		history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
	});

	onMount(() => {
		syncFiltersFromUrl();
		const storeId = data.store.id;
		const channel = supabase
			.channel(`store-catalog-${storeId}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` },
				() => refreshProducts(),
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'stores', filter: `id=eq.${storeId}` },
				(payload) => {
					if (payload.new && typeof payload.new === 'object') store = payload.new as Store;
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	});

	async function refreshProducts() {
		const { data: fresh } = await supabase
			.from('products')
			.select('*')
			.eq('store_id', data.store.id)
			.order('position', { ascending: true });
		products = (fresh as Product[] | null)?.map((p) => ({
			...p,
			variants: Array.isArray(p.variants) ? p.variants : [],
			images: Array.isArray(p.images) ? p.images : [],
		})) ?? [];
	}

	$effect(() => {
		const t = setTimeout(() => (loaded = true), 400);
		return () => clearTimeout(t);
	});

	let categories = $derived(
		Array.from(new Set(products.map((p) => p.category))).sort()
	);

	let filtered = $derived(
		products
			.filter((p) => {
				const q = filters.searchQuery.toLowerCase();
				const matchesSearch =
					!q ||
					p.name.toLowerCase().includes(q) ||
					(p.description ?? '').toLowerCase().includes(q);
				const matchesCategory = !filters.selectedCategory || p.category === filters.selectedCategory;
				return matchesSearch && matchesCategory;
			})
			.sort((a, b) => {
				switch (filters.sortOrder) {
					case 'precio-asc':
						return a.price - b.price;
					case 'precio-desc':
						return b.price - a.price;
					case 'nuevos':
						return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
					default:
						return 0;
				}
			}),
	);

	let groupedByCategory = $derived(
		categories
			.map((cat) => ({
				name: cat,
				products: filtered.filter((p) => p.category === cat),
			}))
			.filter((g) => g.products.length > 0)
	);

	function clearFilters() {
		filters.resetFilters();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
			e.preventDefault();
			document.querySelector<HTMLInputElement>('nav input')?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{store.name} | Catálogo</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	<div class="mb-8">
		<h1 class="text-2xl sm:text-3xl font-bold text-ink">{store.name}</h1>
	</div>

	{#if categories.length > 1}
		<div class="flex flex-wrap gap-2 mb-8">
			<button
				onclick={() => filters.setCategory(null)}
				class="px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 cursor-pointer
					{!filters.selectedCategory
						? 'bg-ember text-white border-ember shadow-lg shadow-ember/20'
						: 'bg-card text-body border-hairline hover:border-ember/50 hover:text-ember'}"
			>
				Todos
			</button>
			{#each categories as cat}
				<button
					onclick={() => filters.setCategory(cat)}
					class="px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 cursor-pointer
						{filters.selectedCategory === cat
							? 'bg-ember text-white border-ember shadow-lg shadow-ember/20'
							: 'bg-card text-body border-hairline hover:border-ember/50 hover:text-ember'}"
				>
					{cat}
				</button>
			{/each}
		</div>
	{/if}

	{#if !loaded}
		<SkeletonCard count={6} />
	{:else if filtered.length === 0}
		<div class="text-center py-20">
			<i class="ri-search-line text-5xl text-muted-soft mb-4 block"></i>
			<p class="text-muted text-lg">No se encontraron productos</p>
			<button
				onclick={clearFilters}
				class="mt-4 text-ember text-sm font-medium hover:text-ember-active transition-colors cursor-pointer"
			>
				Limpiar filtros
			</button>
		</div>
	{:else}
		<div class="flex items-center justify-between gap-3 mb-6">
			<p class="text-sm text-muted">
				{filtered.length} producto{filtered.length === 1 ? '' : 's'}
			</p>
			<select
				class="select-pill cursor-pointer"
				value={filters.sortOrder}
				onchange={(e) => filters.setSortOrder((e.target as HTMLSelectElement).value as SortOrder)}
				aria-label="Ordenar productos"
			>
				<option value="relevancia">Más relevantes</option>
				<option value="nuevos">Más recientes</option>
				<option value="precio-asc">Precio: menor a mayor</option>
				<option value="precio-desc">Precio: mayor a menor</option>
			</select>
		</div>
		{#if filters.selectedCategory || filters.searchQuery || filters.sortOrder !== 'relevancia'}
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				{#each filtered as product}
					<ProductCard {product} store={store} />
				{/each}
			</div>
		{:else}
			{#each groupedByCategory as group}
				<div class="mb-10">
					<h2 class="text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2">
						{group.name}
						<span class="text-sm font-normal text-muted-soft">({group.products.length})</span>
					</h2>
					<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
						{#each group.products as product}
							<ProductCard {product} store={store} />
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	{/if}
</section>
