<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { supabase } from '$lib/supabase/client';
	import { formatPrice, productImage, productImages, storePagePath, storeUrl, waLink } from '$lib/utils';
	import type { Product, Store } from '$lib/types';

	let { data }: { data: { store: Store; product: Product } } = $props();

	let product = $state(data.product);

	onMount(() => {
		const channel = supabase
			.channel(`store-product-${product.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'products', filter: `id=eq.${product.id}` },
				(payload) => {
					if (payload.new && typeof payload.new === 'object') {
						const p = payload.new as Product;
						product = { ...p, variants: Array.isArray(p.variants) ? p.variants : [], images: Array.isArray(p.images) ? p.images : [] };
					}
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	});

	let selectedVariant = $state(product.variants[0] ?? null);
	let imgError = $state(false);
	let activeIndex = $state(0);

	const photos = $derived(productImages(product));
	const activePhoto = $derived(photos[Math.min(activeIndex, photos.length - 1)] ?? null);

	let currentPrice = $derived(selectedVariant ? selectedVariant.price : product.price);
	let isAgotado = $derived(
		product.agotado ||
		(product.variants.length > 0 && product.variants.every((v) => v.agotado)) ||
		selectedVariant?.agotado ||
		false
	);

	const img = $derived(productImage(product));
	const shareUrl = $derived(`${storeUrl(data.store.slug)}/p/${product.id}`);

	function buyNow() {
		cart.addItem(data.store.slug, product.id, selectedVariant?.id);
		goto(storePagePath(data.store.slug, '/checkout', $page.url.host));
	}
</script>

<svelte:head>
	<title>{product.name} | {data.store.name}</title>
	<meta name="description" content={product.description ?? `${product.name} en ${data.store.name}.`} />
	<meta property="og:type" content="product" />
	<meta property="og:title" content={`${product.name} | ${data.store.name}`} />
	<meta property="og:description" content={product.description ?? `${product.name} en ${data.store.name}.`} />
	<meta property="og:url" content={shareUrl} />
	{#if img}
		<meta property="og:image" content={img} />
	{/if}
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<a href={storePagePath(data.store.slug, '', $page.url.host)} class="inline-flex items-center gap-1.5 text-sm text-body hover:text-ember transition-colors no-underline mb-6">
		<i class="ri-arrow-left-line"></i>
		Volver al catálogo
	</a>

	<div class="grid sm:grid-cols-2 gap-8 sm:gap-10 items-start">
		<div>
			<div class="bg-card border border-hairline rounded-card overflow-hidden">
				<div class="aspect-[4/3] bg-canvas">
					{#if activePhoto && !imgError}
						<img src={activePhoto} alt={product.name} class="w-full h-full object-cover" onerror={() => imgError = true} />
					{/if}
				</div>
			</div>
			{#if photos.length > 1}
				<div class="flex gap-2 mt-2 overflow-x-auto pb-1">
					{#each photos as photo, i}
						<button
							onclick={() => { activeIndex = i; imgError = false; }}
							class="h-16 w-16 flex-shrink-0 rounded-btn overflow-hidden border-2 transition-all cursor-pointer bg-canvas
								{activeIndex === i ? 'border-ember' : 'border-hairline hover:border-ember/50'}"
							aria-label={`Ver foto ${i + 1}`}
						>
							<img src={photo} alt={`${product.name} ${i + 1}`} class="w-full h-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="space-y-5">
			<div>
				<p class="text-xs text-muted uppercase tracking-wider mb-1">{product.category}</p>
				<h1 class="text-2xl sm:text-3xl font-bold text-ink">{product.name}</h1>
			</div>

			{#if product.description}
				<p class="text-sm sm:text-base text-body leading-relaxed">{product.description}</p>
			{/if}

			{#if product.variants.length > 0}
				<div>
					<p class="text-xs sm:text-sm text-muted mb-2">Elige una opción:</p>
					<div class="flex flex-wrap gap-2">
						{#each product.variants as variant}
							<button
								onclick={() => selectedVariant = variant}
								disabled={variant.agotado}
								class="px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200
									{variant.agotado
										? 'border-hairline text-muted-soft cursor-not-allowed line-through'
										: selectedVariant?.id === variant.id
											? 'bg-ember text-white border-ember shadow-lg shadow-ember/20 cursor-pointer'
											: 'bg-card text-body border-hairline hover:border-ember/50 hover:text-ember cursor-pointer'}"
							>
								{variant.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if isAgotado}
				<div class="bg-bone rounded-btn p-3 sm:p-4 text-center">
					<p class="text-sm font-medium text-muted-soft">Producto agotado</p>
				</div>
			{:else}
				<div class="bg-bone rounded-btn p-3 sm:p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-xs sm:text-sm text-muted mb-0.5">Precio</p>
							<p class="text-xl sm:text-2xl font-bold text-ember">{formatPrice(currentPrice, product.currency)}</p>
						</div>
						{#if product.bajo_pedido}
							<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/15 text-warning text-xs font-semibold flex-shrink-0">
								<i class="ri-time-line"></i>
								Bajo pedido
							</span>
						{/if}
					</div>
				</div>
			{/if}

			<div class="space-y-3">
				{#if isAgotado}
					<button
						disabled
						class="w-full bg-bone text-muted-soft px-5 py-3 rounded-btn text-sm sm:text-base font-medium cursor-not-allowed"
					>
						Agotado
					</button>
				{:else}
					<div class="flex gap-3">
						<button
							onclick={buyNow}
							class="flex-1 bg-ember text-white px-5 py-3 rounded-btn text-sm sm:text-base font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
						>
							Comprar
						</button>
						<button
							onclick={() => cart.addItem(data.store.slug, product.id, selectedVariant?.id)}
							class="flex-1 px-5 py-3 border border-hairline text-body rounded-btn text-sm sm:text-base font-medium transition-all duration-200 hover:bg-bone cursor-pointer flex items-center justify-center gap-2"
						>
							<i class="ri-add-line"></i>
							Añadir al carrito
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>
