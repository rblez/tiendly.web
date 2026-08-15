<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice, productImage } from '$lib/utils';
	import { onMount } from 'svelte';
	import type { Product, Store, Variant } from '$lib/types';

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
			products[row.id] = { ...row, variants: (Array.isArray(row.variants) ? row.variants : []) as unknown as Variant[], images: (Array.isArray(row.images) ? row.images : []) as unknown as string[] };
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
	let itemCount = $derived(cartLines.reduce((sum, cp) => sum + cp.quantity, 0));
	let currency = $derived(cartLines[0]?.product.currency ?? 'CUP');
</script>

<svelte:head>
	<title>Tu carrito | {data.store.name}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else if cartEmpty}
		<div class="text-center py-20">
			<div class="mx-auto w-20 h-20 rounded-full bg-bone flex items-center justify-center mb-5">
				<i class="ri-shopping-cart-line text-3xl text-muted-soft"></i>
			</div>
			<h1 class="text-2xl font-bold text-ink mb-1.5">Tu carrito está vacío</h1>
			<p class="text-sm text-muted mb-7">Explora el catálogo y añade algo que te guste.</p>
			<a
				href={`/@${data.store.slug}`}
				class="inline-flex items-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline"
			>
				Ver productos
				<i class="ri-arrow-right-line"></i>
			</a>
		</div>
	{:else}
		<div class="flex items-end justify-between gap-4 mb-7">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold text-ink">Tu carrito</h1>
				<p class="text-sm text-muted mt-1">
					{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
				</p>
			</div>
			<a
				href={`/@${data.store.slug}`}
				class="inline-flex items-center gap-1.5 text-sm text-body hover:text-ember transition-colors no-underline whitespace-nowrap"
			>
				<i class="ri-arrow-left-line"></i>
				Seguir comprando
			</a>
		</div>

		<ul class="space-y-3 mb-6">
			{#each cartLines as cp}
				<li class="flex gap-4 bg-card border border-hairline rounded-card p-4 sm:p-5">
					{#if productImage(cp.product)}
						<img
							src={productImage(cp.product)!}
							alt={cp.product.name}
							class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-btn bg-canvas flex-shrink-0"
						/>
					{:else}
						<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-btn bg-canvas flex items-center justify-center flex-shrink-0">
							<i class="ri-image-line text-2xl text-muted-soft"></i>
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="flex items-start justify-between gap-2">
							<h3 class="font-semibold text-ink leading-snug">
								<a href={`/@${data.store.slug}/p/${cp.product.id}`} class="hover:text-ember transition-colors no-underline">
									{cp.product.name}
								</a>
							</h3>
							<button
								onclick={() => cart.removeItem(cp.productId, cp.variantId)}
								class="p-1.5 text-muted-soft hover:text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer flex-shrink-0"
								aria-label="Eliminar"
							>
								<i class="ri-delete-bin-line text-lg"></i>
							</button>
						</div>
						{#if cp.label}
							<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-bone text-muted text-[11px] font-medium mt-1.5">
								{cp.label}
							</span>
						{/if}
						<div class="mt-3 flex items-center justify-between gap-3">
							<div class="inline-flex items-center border border-hairline rounded-full px-1 py-1">
								<button
									onclick={() => cart.updateQuantity(cp.productId, cp.quantity - 1, cp.variantId)}
									class="w-8 h-8 flex items-center justify-center rounded-full text-ink hover:bg-bone transition-colors cursor-pointer"
									aria-label="Restar"
								>
									<i class="ri-subtract-line"></i>
								</button>
								<span class="w-8 text-center font-semibold text-ink tabular-nums">{cp.quantity}</span>
								<button
									onclick={() => cart.updateQuantity(cp.productId, cp.quantity + 1, cp.variantId)}
									class="w-8 h-8 flex items-center justify-center rounded-full text-ink hover:bg-bone transition-colors cursor-pointer"
									aria-label="Sumar"
								>
									<i class="ri-add-line"></i>
								</button>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-ink tabular-nums">{formatPrice(cp.price * cp.quantity, cp.product.currency)}</p>
								{#if cp.quantity > 1}
									<p class="text-[11px] text-muted-soft tabular-nums">{formatPrice(cp.price, cp.product.currency)} c/u</p>
								{/if}
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>

		<div class="bg-card border border-hairline rounded-card p-5 sm:p-6">
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted">Subtotal</span>
				<span class="font-medium text-ink tabular-nums">{formatPrice(total, currency)}</span>
			</div>
			<div class="flex items-center justify-between text-sm mt-2">
				<span class="text-muted">Envío</span>
				<span class="text-body">A acordar por WhatsApp</span>
			</div>
			<div class="border-t border-hairline mt-4 pt-4 flex items-center justify-between">
				<span class="text-lg font-bold text-ink">Total</span>
				<span class="text-xl font-black text-ember tabular-nums">{formatPrice(total, currency)}</span>
			</div>

			<a
				href={`/@${data.store.slug}/checkout`}
				class="mt-6 w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-6 py-3.5 rounded-btn text-base font-bold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline"
			>
				Continuar al checkout
				<i class="ri-arrow-right-line"></i>
			</a>
			<a
				href={`/@${data.store.slug}`}
				class="mt-3 block text-center text-sm text-body hover:text-ember transition-colors no-underline"
			>
				Seguir comprando
			</a>
		</div>
	{/if}
</section>
