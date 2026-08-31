<script lang="ts">
	import type { Product, Store } from '$lib/types';
	import { productImage, imageSrcset, productStock, isOutOfStock } from '$lib/utils';
	import { displayFormat } from '$lib/stores/currency.svelte';

	let { product, store }: { product: Product; store: Store } = $props();

	let imgError = $state(false);

	let isAgotado = $derived(
		product.agotado ||
		isOutOfStock(productStock(product)) ||
		(product.variants.length > 0 &&
			product.variants.every((v) => {
				const options = v.options ?? [];
				return v.agotado || isOutOfStock(productStock(product, v.id)) || (options.length > 0 && options.every((o) => o.agotado || isOutOfStock(o.stock)));
			}))
	);

	let minPrice = $derived(
		product.variants.length > 0
			? Math.min(
					...product.variants
						.filter((v) => !v.agotado && !isOutOfStock(productStock(product, v.id)))
						.map((v) => {
							const options = v.options ?? [];
							const live = options.filter((o) => !o.agotado && !isOutOfStock(o.stock));
							if (options.length > 0 && live.length === 0) return Infinity;
							return v.price + (live.length > 0 ? Math.min(...live.map((o) => o.price)) : 0);
						}),
				)
			: product.price
	);

	const curStock = $derived(product.variants.length === 0 ? productStock(product) : null);

	const img = $derived(productImage(product));
	const productUrl = $derived(`/@${store.slug}/p/${product.id}`);
</script>

<a
	href={productUrl}
	class="bg-card border border-hairline rounded-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-ink/5 hover:-translate-y-0.5 no-underline block"
>
	<div class="aspect-[4/3] bg-canvas overflow-hidden relative">
		{#if img && !imgError}
			<img
				src={img}
				srcset={imageSrcset(img) ?? undefined}
				sizes="(min-width: 1024px) 25vw, 50vw"
				alt={product.name}
				width="640"
				height="480"
				class="w-full h-full object-cover"
				loading="lazy"
				decoding="async"
				onerror={() => imgError = true}
			/>
		{/if}
		<span class="absolute left-3 top-3 inline-flex flex-col items-start gap-0.5 rounded-lg bg-card/95 px-3 py-2 text-ink shadow-sm backdrop-blur-sm">
			<span class="text-sm font-bold leading-tight text-ember sm:text-base">
				{#if product.variants.length > 0}
					Desde {displayFormat(minPrice, store)}
				{:else}
					{displayFormat(product.price, store)}
				{/if}
			</span>
			{#if product.bajo_pedido}
				<span class="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-warning">
					<i class="ri-time-line" aria-hidden="true"></i>
					Bajo pedido
				</span>
			{/if}
		</span>
	</div>
	<div class="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
		<h3 class="text-sm sm:text-lg font-semibold text-ink leading-tight">{product.name}</h3>
		{#if product.description}
			<p class="text-xs sm:text-sm text-body leading-relaxed line-clamp-2">{product.description}</p>
		{/if}
		{#if !isAgotado && curStock != null}
			<span class="chip w-fit bg-ember/10 text-ember">
				<i class="ri-truck-line"></i>
				Quedan {curStock}
			</span>
		{/if}

		<span
			class="btn btn-sm w-full mt-2 {isAgotado ? 'btn-secondary text-muted-soft cursor-not-allowed' : 'btn-3d'}"
		>
			{isAgotado ? 'Agotado' : product.variants.length > 0 ? 'Ver opciones' : 'Ver producto'}
		</span>
	</div>
</a>
