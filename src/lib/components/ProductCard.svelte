<script lang="ts">
	import type { Product, Store } from '$lib/types';
	import { formatPrice, productImage } from '$lib/utils';

	let { product, store }: { product: Product; store: Store } = $props();

	let imgError = $state(false);

	let isAgotado = $derived(
		product.agotado ||
		(product.variants.length > 0 && product.variants.every((v) => v.agotado))
	);

	let minPrice = $derived(
		product.variants.length > 0
			? Math.min(...product.variants.filter((v) => !v.agotado).map((v) => v.price))
			: product.price
	);

	const img = $derived(productImage(product));
	const productUrl = $derived(`/@${store.slug}/p/${product.id}`);
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
				class="w-full h-full object-cover"
				loading="lazy"
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
			Desde {formatPrice(minPrice, product.currency)}
		{:else}
			{formatPrice(product.price, product.currency)}
		{/if}
		{#if !isAgotado && product.bajo_pedido}
			<span class="ml-2 align-middle inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-semibold">
				<i class="ri-time-line"></i>
				Bajo pedido
			</span>
		{/if}
	</p>

		<span
			class="w-full mt-2 px-4 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2
				{isAgotado
					? 'bg-bone text-muted-soft cursor-not-allowed'
					: 'bg-ember text-white hover:bg-ember-active'}"
		>
			{isAgotado ? 'Agotado' : 'Ver opciones'}
		</span>
	</div>
</a>
