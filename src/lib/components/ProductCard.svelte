<script lang="ts">
	import type { Product, Store } from '$lib/types';
	import { productImage } from '$lib/utils';
	import { displayPrice, displayCurrency, displayFormat } from '$lib/stores/currency.svelte';
	import { isCatalogMode, storeAction, actionLink, actionConfig, productOrderMessage } from '$lib/storeActions';

	let { product, store }: { product: Product; store: Store } = $props();

	let imgError = $state(false);

	let isAgotado = $derived(
		product.agotado ||
		(product.variants.length > 0 &&
			product.variants.every((v) => {
				const options = v.options ?? [];
				return v.agotado || (options.length > 0 && options.every((o) => o.agotado));
			}))
	);

	let minPrice = $derived(
		product.variants.length > 0
			? Math.min(
					...product.variants
						.filter((v) => !v.agotado)
						.map((v) => {
							const options = v.options ?? [];
							const live = options.filter((o) => !o.agotado);
							if (options.length > 0 && live.length === 0) return Infinity;
							return v.price + (live.length > 0 ? Math.min(...live.map((o) => o.price)) : 0);
						}),
				)
			: product.price
	);

	const img = $derived(productImage(product));
	const productUrl = $derived(`/@${store.slug}/p/${product.id}`);

	const catalogMode = $derived(isCatalogMode(store));
	const action = $derived(storeAction(store));
	const displayProduct = $derived({
		name: product.name,
		price: displayPrice(product.price, store),
		currency: displayCurrency(store),
	});
	const ctaHref = $derived(actionLink(action, store, productOrderMessage(store, displayProduct, null)));
	const direct = $derived(catalogMode && !isAgotado && product.variants.length === 0);
</script>

<a
	href={productUrl}
	class="bg-card border border-hairline rounded-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-ink/5 hover:-translate-y-0.5 no-underline block"
>
	<div class="aspect-[4/3] bg-canvas overflow-hidden">
		{#if img && !imgError}
			<img
				src={img}
				alt={product.name}
				width="640"
				height="480"
				class="w-full h-full object-cover"
				loading="lazy"
				decoding="async"
				onerror={() => imgError = true}
			/>
		{/if}
	</div>
	<div class="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
		<h3 class="text-sm sm:text-lg font-semibold text-ink leading-tight">{product.name}</h3>
		{#if product.description}
			<p class="text-xs sm:text-sm text-body leading-relaxed line-clamp-2">{product.description}</p>
		{/if}

	<p class="text-base sm:text-xl font-bold text-ember">
		{#if isAgotado}
			<span class="text-muted-soft">Agotado</span>
		{:else if product.variants.length > 0}
			Desde {displayFormat(minPrice, store)}
		{:else}
			{displayFormat(product.price, store)}
		{/if}
		{#if !isAgotado && product.bajo_pedido}
			<span class="ml-2 align-middle inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-semibold">
				<i class="ri-time-line"></i>
				Bajo pedido
			</span>
		{/if}
	</p>

		{#if direct}
			<span
				role="button"
				tabindex="0"
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (ctaHref) window.open(ctaHref, '_blank');
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.stopPropagation();
						if (ctaHref) window.open(ctaHref, '_blank');
					}
				}}
				class="btn-3d w-full mt-2 px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 select-none"
			>
				<i class={actionConfig(action).icon}></i>
				{actionConfig(action).label}
			</span>
		{:else}
			<span
				class="w-full mt-2 px-4 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2
					{isAgotado
						? 'bg-bone text-muted-soft cursor-not-allowed'
						: 'btn-3d font-semibold'}"
			>
				{isAgotado ? 'Agotado' : 'Ver producto'}
			</span>
		{/if}
	</div>
</a>