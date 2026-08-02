<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice, productImage } from '$lib/utils';
	import { onMount } from 'svelte';
	import type { Product, Store } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	let products = $state<Record<string, Product>>({});
	let loaded = $state(false);

	onMount(async () => {
		const { supabase } = await import('$lib/supabase/client');
		const items = cart.items.filter((i) => i.storeSlug === data.store.slug);
		if (items.length === 0) {
			loaded = true;
			return;
		}
		const ids = items.map((i) => i.productId);
		const { data: rows } = await supabase.from('products').select('*').in('id', ids);
		for (const row of rows ?? []) {
			products[row.id] = { ...row, variants: Array.isArray(row.variants) ? row.variants : [] };
		}
		loaded = true;
	});

	let cartLines = $derived(
		cart.items
			.filter((i) => i.storeSlug === data.store.slug)
			.map((ci) => {
				const product = products[ci.productId];
				if (!product) return null;
				const variant = ci.variantId
					? product.variants.find((v) => v.id === ci.variantId)
					: null;
				const price = variant ? variant.price : product.price;
				return { ...ci, product, variant, price, label: variant?.label ?? null };
			})
			.filter((x): x is NonNullable<typeof x> => x !== null)
	);

	let total = $derived(cartLines.reduce((sum, cp) => sum + cp.price * cp.quantity, 0));
	let cartEmpty = $derived(cart.items.filter((i) => i.storeSlug === data.store.slug).length === 0);
</script>

<svelte:head>
	<title>Carrito | {data.store.name}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	<h1 class="text-3xl sm:text-4xl font-bold text-ink mb-10">Carrito</h1>

	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else if cartEmpty}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<p class="text-lg text-muted mb-6">Tu carrito está vacío</p>
			<a
				href={`/@/${data.store.slug}`}
				class="inline-flex bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline"
			>
				Ver productos
			</a>
		</div>
	{:else}
		<div class="space-y-4 mb-8">
			{#each cartLines as cp}
				<div class="flex items-center gap-4 bg-card border border-hairline rounded-card p-4">
					{#if productImage(cp.product)}
						<img
							src={productImage(cp.product)!}
							alt={cp.product.name}
							class="w-20 h-20 object-cover rounded-lg bg-canvas flex-shrink-0"
						/>
					{:else}
						<div class="w-20 h-20 rounded-lg bg-canvas flex items-center justify-center flex-shrink-0">
							<i class="ri-image-line text-2xl text-muted-soft"></i>
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-ink truncate">
							{cp.product.name}
							{#if cp.label}
								<span class="text-xs text-ember font-normal"> — {cp.label}</span>
							{/if}
						</h3>
						<p class="text-sm text-muted mt-0.5">{formatPrice(cp.price, cp.product.currency)}</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => cart.updateQuantity(cp.productId, cp.quantity - 1, cp.variantId)}
							class="w-8 h-8 flex items-center justify-center border border-hairline rounded-md text-ink hover:bg-bone transition-colors cursor-pointer text-lg"
						>-</button>
						<span class="w-8 text-center font-medium text-ink">{cp.quantity}</span>
						<button
							onclick={() => cart.updateQuantity(cp.productId, cp.quantity + 1, cp.variantId)}
							class="w-8 h-8 flex items-center justify-center border border-hairline rounded-md text-ink hover:bg-bone transition-colors cursor-pointer text-lg"
						>+</button>
					</div>
					<button
						onclick={() => cart.removeItem(cp.productId, cp.variantId)}
						class="p-2 text-muted-soft hover:text-error transition-colors cursor-pointer"
						aria-label="Eliminar"
					>
						<i class="ri-delete-bin-line text-lg"></i>
					</button>
				</div>
			{/each}
		</div>

		<div class="bg-card border border-hairline rounded-card p-6">
			<div class="flex items-center justify-between">
				<span class="text-lg font-bold text-ink">Total</span>
				<span class="text-xl font-bold text-ember">{formatPrice(total, cartLines[0]?.product.currency ?? 'CUP')}</span>
			</div>

			<a
				href={`/@/${data.store.slug}/checkout`}
				class="mt-6 w-full flex items-center justify-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-base font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline"
			>
				Proceder al checkout
			</a>
		</div>
	{/if}
</section>
