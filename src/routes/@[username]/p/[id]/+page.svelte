<script lang="ts">
	import { onMount } from 'svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { supabase } from '$lib/supabase/client';
	import { formatPrice, productImage, productImages, storeUrl, SITE_URL, variantPrice } from '$lib/utils';
	import { displayCurrency as viewCurrency, displayPrice as toDisplayPrice } from '$lib/stores/currency.svelte';
	import { track } from '$lib/analytics';
	import { isCatalogMode, storeAction, actionLink, actionConfig, productOrderMessage } from '$lib/storeActions';
	import type { Product, Store, Variant } from '$lib/types';

	let { data }: { data: { store: Store; product: Product } } = $props();

	let product = $state(data.product);

	function firstAvailable(): Variant | null {
		return (
			product.variants.find((v) => {
				const options = v.options ?? [];
				return !v.agotado && !(options.length > 0 && options.every((o) => o.agotado));
			}) ?? product.variants[0] ?? null
		);
	}

	onMount(() => {
		track('view_item', {
			value: displayPrice,
			currency: displayCurrency,
			content_ids: [product.id],
			content_name: product.name,
		});
		const channel = supabase
			.channel(`store-product-${product.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'products', filter: `id=eq.${product.id}` },
				(payload) => {
					if (payload.new && typeof payload.new === 'object') {
						const p = payload.new as Product;
						product = { ...p, variants: Array.isArray(p.variants) ? p.variants : [], images: Array.isArray(p.images) ? p.images : [], ask: Array.isArray(p.ask) ? p.ask : [] };
					}
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	});

	let selectedVariant = $state(firstAvailable());
	let selectedOption = $state<string | null>(null);
	let imgError = $state(false);
	let activeIndex = $state(0);
	let added = $state(false);

	const selectedOptions = $derived(selectedVariant ? (selectedVariant.options ?? []) : []);
	const selectedOptionObj = $derived(
		selectedOption && selectedVariant ? (selectedVariant.options ?? []).find((o) => o.id === selectedOption) ?? null : null
	);

	let currentPrice = $derived(variantPrice(selectedVariant, selectedOption, product.price));

	const catalogMode = $derived(isCatalogMode(data.store));
	const action = $derived(storeAction(data.store));
	const actionBtn = $derived(actionConfig(action));
	const displayProduct = $derived({
		name: product.name,
		price: toDisplayPrice(currentPrice, data.store),
		currency: viewCurrency(data.store),
	});
	const ctaHref = $derived(actionLink(action, data.store, productOrderMessage(data.store, displayProduct, selectedVariant, selectedOption)));

	const photos = $derived(productImages(product));
	const activePhoto = $derived(photos[Math.min(activeIndex, photos.length - 1)] ?? null);
	let isAgotado = $derived(
		product.agotado ||
		(product.variants.length > 0 && product.variants.every((v) => v.agotado)) ||
		selectedVariant?.agotado ||
		(selectedOptions.length > 0
			? selectedOptions.every((o) => o.agotado) || (selectedOptionObj?.agotado ?? false)
			: false) ||
		false
	);

	const img = $derived(productImage(product));
	const shareUrl = $derived(`${storeUrl(data.store.slug)}/p/${product.id}`);
	const displayPrice = $derived(toDisplayPrice(currentPrice, data.store));
	const displayCurrency = $derived(viewCurrency(data.store));
	const productLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: product.name,
			description: product.description ?? undefined,
			image: img ? [img] : undefined,
			brand: { '@type': 'Brand', name: data.store.name },
			offers: {
				'@type': 'Offer',
				price: String(displayPrice),
				priceCurrency: displayCurrency,
				availability: isAgotado ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
				url: shareUrl,
			},
		}),
	);
	const breadcrumbLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Tiendly', item: SITE_URL },
				{ '@type': 'ListItem', position: 2, name: data.store.name, item: storeUrl(data.store.slug) },
				{ '@type': 'ListItem', position: 3, name: product.name, item: shareUrl },
			],
		}),
	);

	function addToCart() {
		cart.addItem(data.store.slug, product.id, selectedVariant?.id, selectedOption ?? undefined);
		track('add_to_cart', {
			value: displayPrice,
			currency: displayCurrency,
			content_ids: [product.id],
			content_name: product.name,
			num_items: 1,
		});
		added = true;
		setTimeout(() => (added = false), 1500);
	}
</script>

<svelte:head>
	<title>{product.name} | {data.store.name}</title>
	<meta name="description" content={product.description ?? `${product.name} en ${data.store.name}.`} />
	<link rel="canonical" href={shareUrl} />
	<meta property="og:type" content="product" />
	<meta property="og:title" content={`${product.name} | ${data.store.name}`} />
	<meta property="og:description" content={product.description ?? `${product.name} en ${data.store.name}.`} />
	<meta property="og:url" content={shareUrl} />
	<meta property="og:site_name" content={data.store.name} />
	<meta property="og:locale" content="es_ES" />
	{#if img}
		<meta property="og:image" content={img} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${product.name} | ${data.store.name}`} />
	<meta name="twitter:description" content={product.description ?? `${product.name} en ${data.store.name}.`} />
	{#if img}
		<meta name="twitter:image" content={img} />
	{/if}
	<script type="application/ld+json">{productLd}</script>
	<script type="application/ld+json">{breadcrumbLd}</script>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<div class="grid sm:grid-cols-2 gap-8 sm:gap-10 items-start pt-4 sm:pt-0">
		<div>
			<div class="bg-card border border-hairline rounded-card overflow-hidden">
				<div class="aspect-[4/3] bg-canvas">
					{#if activePhoto && !imgError}
						<img src={activePhoto} alt={product.name} width="1024" height="768" class="w-full h-full object-cover" decoding="async" onerror={() => imgError = true} />
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
							<img src={photo} alt={`${product.name} ${i + 1}`} width="64" height="64" class="w-full h-full object-cover" loading="lazy" decoding="async" />
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

			{#if (product.ask ?? []).length > 0 && !catalogMode}
				<div class="bg-bone rounded-btn p-3 sm:p-4">
					<p class="text-xs font-semibold text-muted mb-1.5">Al pedir tendrás que indicar:</p>
					<ul class="flex flex-wrap gap-1.5">
						{#each product.ask as a}
							<li class="text-xs font-medium text-body bg-card border border-hairline rounded-full px-2.5 py-1">{a}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if product.variants.length > 0}
			<div>
				<div class="flex items-center justify-between gap-2 mb-2">
					<p class="text-xs sm:text-sm text-muted">Elige una opción:</p>
					{#if selectedVariant}
						<p class="text-xs font-medium text-ember truncate">Seleccionado: {selectedVariant.label}</p>
					{/if}
				</div>
				<div class="flex flex-wrap gap-2 sm:grid sm:grid-cols-3">
					{#each product.variants as variant}
						<button
							role="radio"
							aria-checked={selectedVariant?.id === variant.id}
							onclick={() => { selectedVariant = variant; selectedOption = null; }}
							disabled={variant.agotado}
							class="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-full border transition-all duration-200 text-left
								{variant.agotado
									? 'border-hairline bg-canvas/50 text-muted-soft cursor-not-allowed'
									: selectedVariant?.id === variant.id
										? 'border-ember bg-ember/10 text-ink cursor-pointer'
										: 'bg-card text-body border-hairline hover:border-ember/50 hover:text-ink cursor-pointer'}"
						>
							<span class="min-w-0 flex items-center gap-1.5">
								<span class="leading-tight {variant.agotado ? 'line-through' : ''}">{variant.label}</span>
								{#if variant.agotado}
									<span class="text-[10px] font-semibold text-muted-soft bg-bone px-1.5 py-0.5 rounded-full">Agotada</span>
								{/if}
							</span>
							{#if selectedVariant?.id === variant.id}
								<i class="ri-check-line text-sm flex-shrink-0 text-ember"></i>
							{/if}
						</button>
					{/each}
				</div>
			</div>
				{#if selectedOptions.length > 0}
					<div>
						<div class="flex items-center justify-between gap-2 mb-2">
							<p class="text-xs sm:text-sm text-muted">Elige una opción de {selectedVariant?.label}:</p>
						</div>
						<div class="flex flex-wrap gap-2 sm:grid sm:grid-cols-3">
							{#each selectedOptions as opt}
								<button
									role="radio"
									aria-checked={selectedOption === opt.id}
									onclick={() => (selectedOption = opt.id)}
									disabled={opt.agotado}
									class="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-full border transition-all duration-200 text-left
										{opt.agotado
											? 'border-hairline bg-canvas/50 text-muted-soft cursor-not-allowed'
											: selectedOption === opt.id
												? 'border-ember bg-ember/10 text-ink cursor-pointer'
												: 'bg-card text-body border-hairline hover:border-ember/50 hover:text-ink cursor-pointer'}"
								>
									<span class="min-w-0 flex items-center gap-1.5">
										<span class="leading-tight {opt.agotado ? 'line-through' : ''}">{opt.label}</span>
										{#if opt.price > 0}
											<span class="text-[11px] font-semibold text-muted-soft tabular-nums">+{formatPrice(toDisplayPrice(opt.price, data.store), displayCurrency)}</span>
										{/if}
										{#if opt.agotado}
											<span class="text-[10px] font-semibold text-muted-soft bg-bone px-1.5 py-0.5 rounded-full">Agotada</span>
										{/if}
									</span>
									{#if selectedOption === opt.id}
										<i class="ri-check-line text-sm flex-shrink-0 text-ember"></i>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
		{/if}

			{#if !isAgotado}
				<div class="bg-bone rounded-btn p-3 sm:p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-xs sm:text-sm text-muted mb-0.5">Precio</p>
							<p class="text-xl sm:text-2xl font-bold text-ember">{formatPrice(displayPrice, displayCurrency)}</p>
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
				{:else if catalogMode}
					<a
						href={ctaHref ?? '#'}
						target="_blank"
						rel="noopener noreferrer"
						onclick={(e) => {
							if (!ctaHref) e.preventDefault();
						}}
						class="btn-3d w-full px-5 py-3 text-sm sm:text-base font-bold no-underline flex items-center justify-center gap-2"
					>
						<i class={actionBtn.icon}></i>
						{actionBtn.label}
					</a>
				{:else}
					<button
						onclick={addToCart}
						class="btn-3d w-full px-5 py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2
							{added ? 'bg-success' : ''}"
					>
						{added ? 'Añadido al carrito' : 'Añadir al carrito'}
					</button>
				{/if}
			</div>
		</div>
	</div>
</section>
