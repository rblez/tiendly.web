<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { appUrl, formatPrice, productImage, productImages, waLink } from '$lib/utils';
	import type { Product, Store } from '$lib/types';

	let { data }: { data: { store: Store; product: Product } } = $props();

	let selectedVariant = $state(data.product.variants[0] ?? null);
	let imgError = $state(false);
	let showShare = $state(false);
	let copied = $state(false);
	let activeIndex = $state(0);

	const photos = $derived(productImages(data.product));
	const activePhoto = $derived(photos[Math.min(activeIndex, photos.length - 1)] ?? null);

	let currentPrice = $derived(selectedVariant ? selectedVariant.price : data.product.price);
	let isAgotado = $derived(
		data.product.agotado ||
		(data.product.variants.length > 0 && data.product.variants.every((v) => v.agotado)) ||
		selectedVariant?.agotado ||
		false
	);

	const img = $derived(productImage(data.product));
	const shareUrl = $derived(`${appUrl() || window.location.origin}/t/${data.store.slug}/p/${data.product.id}`);
	const shareText = $derived(`Mira esto: ${data.product.name}${selectedVariant ? ` — ${selectedVariant.label}` : ''} — ${formatPrice(currentPrice, data.product.currency)}`);

	function buyNow() {
		cart.addItem(data.store.slug, data.product.id, selectedVariant?.id);
		goto(`/t/${data.store.slug}/checkout`);
	}

	function shareWhatsApp() {
		window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
		showShare = false;
	}

	function shareTelegram() {
		window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
		showShare = false;
	}

	function shareFacebook() {
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
		showShare = false;
	}

	function shareX() {
		window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
		showShare = false;
	}

	async function copyLink() {
		await navigator.clipboard.writeText(shareUrl);
		copied = true;
		showShare = false;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>{data.product.name} | {data.store.name}</title>
	<meta name="description" content={data.product.description ?? `${data.product.name} en ${data.store.name}.`} />
	<meta property="og:type" content="product" />
	<meta property="og:title" content={`${data.product.name} | ${data.store.name}`} />
	<meta property="og:description" content={data.product.description ?? `${data.product.name} en ${data.store.name}.`} />
	<meta property="og:url" content={shareUrl} />
	{#if img}
		<meta property="og:image" content={img} />
	{/if}
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<a href={`/t/${data.store.slug}`} class="inline-flex items-center gap-1.5 text-sm text-body hover:text-ember transition-colors no-underline mb-6">
		<i class="ri-arrow-left-line"></i>
		Volver al catálogo
	</a>

	<div class="grid sm:grid-cols-2 gap-8 sm:gap-10 items-start">
		<div>
			<div class="bg-card border border-hairline rounded-card overflow-hidden">
				<div class="aspect-[4/3] bg-canvas">
					{#if activePhoto && !imgError}
						<img src={activePhoto} alt={data.product.name} class="w-full h-full object-cover" onerror={() => imgError = true} />
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
							<img src={photo} alt={`${data.product.name} ${i + 1}`} class="w-full h-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="space-y-5">
			<div>
				<p class="text-xs text-muted uppercase tracking-wider mb-1">{data.product.category}</p>
				<h1 class="text-2xl sm:text-3xl font-bold text-ink">{data.product.name}</h1>
			</div>

			{#if data.product.description}
				<p class="text-sm sm:text-base text-body leading-relaxed">{data.product.description}</p>
			{/if}

			{#if data.product.variants.length > 0}
				<div>
					<p class="text-xs sm:text-sm text-muted mb-2">Elige una opción:</p>
					<div class="flex flex-wrap gap-2">
						{#each data.product.variants as variant}
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
					<p class="text-xs sm:text-sm text-muted mb-0.5">Precio</p>
					<p class="text-xl sm:text-2xl font-bold text-ember">{formatPrice(currentPrice, data.product.currency)}</p>
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
							onclick={() => cart.addItem(data.store.slug, data.product.id, selectedVariant?.id)}
							class="flex-1 px-5 py-3 border border-hairline text-body rounded-btn text-sm sm:text-base font-medium transition-all duration-200 hover:bg-bone cursor-pointer flex items-center justify-center gap-2"
						>
							<i class="ri-add-line"></i>
							Añadir al carrito
						</button>
					</div>
				{/if}

				<div class="relative">
					<button
						onclick={() => showShare = !showShare}
						class="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-hairline text-body rounded-btn text-sm font-medium transition-all duration-200 hover:bg-bone cursor-pointer"
					>
						<i class="ri-share-line"></i>
						{copied ? '¡Enlace copiado!' : 'Compartir'}
					</button>

					{#if showShare}
						<div class="absolute bottom-full left-0 right-0 mb-2 bg-card border border-hairline rounded-card p-3 space-y-1 shadow-xl">
							<button onclick={shareWhatsApp} class="w-full flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-bone rounded-btn transition-colors cursor-pointer text-left">
								<img src="https://cdn.simpleicons.org/WhatsApp/FFFFFF" class="w-5 h-5" alt="WhatsApp" />
								WhatsApp
							</button>
							<button onclick={shareTelegram} class="w-full flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-bone rounded-btn transition-colors cursor-pointer text-left">
								<img src="https://cdn.simpleicons.org/Telegram/FFFFFF" class="w-5 h-5" alt="Telegram" />
								Telegram
							</button>
							<button onclick={shareFacebook} class="w-full flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-bone rounded-btn transition-colors cursor-pointer text-left">
								<img src="https://cdn.simpleicons.org/Facebook/FFFFFF" class="w-5 h-5" alt="Facebook" />
								Facebook
							</button>
							<button onclick={shareX} class="w-full flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-bone rounded-btn transition-colors cursor-pointer text-left">
								<img src="https://cdn.simpleicons.org/X/FFFFFF" class="w-5 h-5" alt="X" />
								X
							</button>
							<button onclick={copyLink} class="w-full flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-bone rounded-btn transition-colors cursor-pointer text-left">
								<i class="ri-link text-lg"></i>
								Copiar enlace
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
