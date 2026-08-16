<script lang="ts">
	import { page } from '$app/stores';
	import { cart } from '$lib/stores/cart.svelte';
	import { filters } from '$lib/stores/filters.svelte';
	import { productImage } from '$lib/utils';
	import { isCatalogMode } from '$lib/storeActions';
	import { currency, availableCurrencies, mainCurrency } from '$lib/stores/currency.svelte';
	import type { Store } from '$lib/types';

	let { store, previewMode = false }: { store: Store; previewMode?: boolean } = $props();

	const catalogMode = $derived(isCatalogMode(store));
	let totalItems = $derived(cart.storeSlug === store.slug ? cart.totalItems() : 0);
	let searchInput: HTMLInputElement | undefined = $state();
	let currencies = $derived(availableCurrencies(store));

	const homePath = $derived(`/@${store.slug}`);
	const cartPath = $derived(`/@${store.slug}/cart`);

	function handleSearch(e: Event) {
		filters.setSearchQuery((e.target as HTMLInputElement).value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && document.activeElement === searchInput) {
			searchInput.blur();
			filters.setSearchQuery('');
		}
	}

	const logo = $derived(productImage({ image: store.logo }));
</script>

<svelte:window onkeydown={handleKeydown} />

<nav class="z-40 bg-canvas/80 backdrop-blur-md border-b border-hairline {previewMode ? '' : 'sticky top-0'}">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16 gap-4">
			<a href={homePath} class="flex items-center gap-2.5 text-ink no-underline shrink-0 min-w-0">
				{#if logo}
					<img src={logo} alt={store.name} width="36" height="36" class="h-9 w-9 object-cover rounded-lg bg-canvas" decoding="async" />
				{:else}
					<span class="h-9 w-9 flex items-center justify-center rounded-lg bg-ember text-canvas font-black select-none">
						{store.name.charAt(0).toUpperCase()}
					</span>
				{/if}
				<span class="text-lg font-bold tracking-tight truncate">{store.name}</span>
			</a>

			{#if $page.url.pathname === homePath}
				<div class="hidden md:block flex-1 max-w-xs">
					<div class="relative">
						<i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"></i>
						<input
							bind:this={searchInput}
							type="text"
							placeholder="Buscar..."
							value={filters.searchQuery}
							oninput={handleSearch}
							class="w-full pl-9 pr-3 py-1.5 bg-card border border-hairline rounded-full text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
						/>
					</div>
				</div>
			{/if}

			<div class="flex items-center gap-4 sm:gap-5">
				{#if currencies.length > 1}
					<select
						aria-label="Cambiar moneda"
						value={currency.display || mainCurrency(store)}
						onchange={(e) => currency.set((e.target as HTMLSelectElement).value)}
						class="bg-card border border-hairline rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-ember transition-colors cursor-pointer"
					>
						{#each currencies as c}
							<option value={c}>{c}</option>
						{/each}
					</select>
				{/if}
				{#if !catalogMode && $page.url.pathname !== cartPath}
					<a
						href={cartPath}
						class="relative flex items-center transition-colors duration-200 no-underline
							{$page.url.pathname === cartPath ? 'text-ember' : 'text-body hover:text-ink'}"
					>
						<i class="{$page.url.pathname === cartPath ? 'ri-shopping-bag-fill' : 'ri-shopping-bag-line'} text-xl sm:text-lg"></i>
						<span class="hidden sm:inline text-sm font-medium ml-1.5">Carrito</span>
						{#if totalItems > 0}
							<span class="absolute -top-2 -right-3 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-ember text-white rounded-full">
								{totalItems}
							</span>
						{/if}
					</a>
				{/if}
			</div>
		</div>
	</div>

	{#if $page.url.pathname === homePath}
		<div class="md:hidden border-t border-hairline px-4 py-2.5">
			<div class="relative">
				<i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"></i>
				<input
					type="text"
					placeholder="Buscar..."
					value={filters.searchQuery}
					oninput={handleSearch}
					onchange={() => filters.selectedCategory !== null && filters.setCategory(null)}
					class="w-full pl-9 pr-3 py-2 bg-card border border-hairline rounded-full text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
				/>
			</div>
		</div>
	{/if}
</nav>
