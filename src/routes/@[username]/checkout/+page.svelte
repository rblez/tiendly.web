<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice, productImage, waLink } from '$lib/utils';
	import type { Product, Store } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	let name = $state('');
	let phone = $state('');
	let notes = $state('');
	let sending = $state(false);

	let directProduct = $state<Product | null>(null);

	$effect(() => {
		const id = $page.url.searchParams.get('product');
		if (!id) return;
		(async () => {
			const { supabase } = await import('$lib/supabase/client');
			const { data: p } = await supabase
				.from('products')
				.select('*')
				.eq('id', id)
				.eq('store_id', data.store.id)
				.maybeSingle();
			if (p) {
				directProduct = { ...p, variants: Array.isArray(p.variants) ? p.variants : [] };
				cart.clear();
			}
		})();
	});

	function findProduct(id: string): Product | null {
		if (directProduct?.id === id) return directProduct;
		return cartProductsCache[id] ?? null;
	}

	// Products cache: fetched lazily on mount for cart items
	let cartProductsCache = $state<Record<string, Product>>({});
	let cacheReady = $state(false);

	$effect(() => {
		const items = cart.items.filter((i) => i.storeSlug === data.store.slug);
		if (items.length === 0) {
			cacheReady = true;
			return;
		}
		(async () => {
			const { supabase } = await import('$lib/supabase/client');
			const ids = items.map((i) => i.productId);
			const { data: rows } = await supabase.from('products').select('*').in('id', ids);
			for (const row of rows ?? []) {
				cartProductsCache[row.id] = { ...row, variants: Array.isArray(row.variants) ? row.variants : [] };
			}
			cacheReady = true;
		})();
	});

	let cartLines = $derived.by(() => {
		if (directProduct) {
			const v = directProduct.variants[0] ?? null;
			return [{
				productId: directProduct.id,
				variantId: v?.id,
				quantity: 1,
				product: directProduct,
				variant: v,
				price: v ? v.price : directProduct.price,
				label: v?.label ?? null,
			}];
		}
		return cart.items
			.filter((i) => i.storeSlug === data.store.slug)
			.map((ci) => {
				const product = findProduct(ci.productId);
				if (!product) return null;
				const variant = ci.variantId
					? product.variants.find((v) => v.id === ci.variantId)
					: null;
				return {
					...ci,
					product,
					variant,
					price: variant ? variant.price : product.price,
					label: variant?.label ?? null,
				};
			})
			.filter((x): x is NonNullable<typeof x> => x !== null);
	});

	let total = $derived(cartLines.reduce((sum, cp) => sum + cp.price * cp.quantity, 0));
	let totalFormatted = $derived(formatPrice(total, directProduct?.currency ?? 'CUP'));
	let cartEmpty = $derived(cartLines.length === 0);

	$effect(() => {
		if (cartEmpty && cacheReady) {
			goto(`/@${data.store.slug}`);
		}
	});

	function buildWhatsAppMessage(): string {
		const items = cartLines.map((cp) => {
			const qty = cp.quantity > 1 ? ` x${cp.quantity}` : '';
			const variant = cp.label ? ` (${cp.label})` : '';
			const currency = cp.product.currency;
			return `▸ ${cp.product.name}${variant}${qty} — ${formatPrice(cp.price * cp.quantity, currency)}`;
		});

		const lines = [
			`Hola ${data.store.name} 👋`,
			``,
			`Quiero hacer este pedido:`,
			...items,
			``,
			`📍 Total: *${totalFormatted}*`,
			`👤 ${name}`,
			`📱 ${phone}`,
			...(notes.trim() ? [`📝 ${notes.trim()}`, ``] : [``]),
			`¿Está disponible?`,
		];

		return encodeURIComponent(lines.join('\n'));
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name || !phone || sending) return;

		sending = true;
		const msg = buildWhatsAppMessage();
		const wa = data.store.whatsapp;

		const items = cartLines.map((cp) => ({
			productId: cp.productId,
			variantId: cp.variantId ?? undefined,
			quantity: cp.quantity,
			productName: cp.product.name,
			label: cp.label,
			price: cp.price,
			currency: cp.product.currency,
		}));

		try {
			const { supabase } = await import('$lib/supabase/client');
			const { data: orderRow } = await supabase
				.from('orders')
				.insert({
					store_id: data.store.id,
					customer_name: name.trim(),
					customer_phone: phone.trim(),
					notes: notes.trim() || null,
					items,
					total,
					currency: directProduct?.currency ?? cartLines[0]?.product.currency ?? 'CUP',
				})
				.select('id')
				.single();
			try {
				sessionStorage.setItem(
					`tiendly-order-${data.store.slug}`,
					JSON.stringify({
						id: orderRow?.id ?? null,
						name: name.trim(),
						phone: phone.trim(),
						items,
						total,
						currency: directProduct?.currency ?? cartLines[0]?.product.currency ?? 'CUP',
						storeName: data.store.name,
						storeSlug: data.store.slug,
					}),
				);
			} catch {
				// sin sessionStorage (privado) → solo WhatsApp
			}
		} catch {
			// no bloquea el envío por WhatsApp
		}

		setTimeout(() => {
			cart.clear();
			window.open(waLink(wa ?? '', msg), '_blank');
			goto(`/@${data.store.slug}/gracias`);
		}, 1200);
	}
</script>

<svelte:head>
	<title>Checkout | {data.store.name}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	<h1 class="text-3xl sm:text-4xl font-bold text-ink mb-10">Checkout</h1>

	{#if cartEmpty && !cacheReady}
		<div class="flex items-center justify-center py-20">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else if cartEmpty}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<p class="text-lg text-muted mb-6">Tu carrito está vacío</p>
			<a
				href={`/@${data.store.slug}`}
				class="inline-flex bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all no-underline"
			>
				Ver productos
			</a>
		</div>
	{:else if !data.store.whatsapp}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<i class="ri-store-2-line text-3xl text-muted-soft mb-4 block"></i>
			<p class="text-lg text-muted mb-2">Esta tienda aún no configura cómo recibir pedidos</p>
			<a
				href={`/@${data.store.slug}`}
				class="inline-flex bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all no-underline"
			>
				Volver al catálogo
			</a>
		</div>
	{:else}
		<div class="max-w-2xl mx-auto space-y-6">
			<div class="bg-card border border-hairline rounded-card p-6 space-y-4">
				<h2 class="text-lg font-semibold text-ink">Tu pedido</h2>
				{#each cartLines as cp}
					<div class="flex items-center justify-between text-sm">
						<div class="text-body">
							<span>{cp.product.name}</span>
							{#if cp.label}
								<span class="text-ember"> — {cp.label}</span>
							{/if}
							<span class="text-muted"> x{cp.quantity}</span>
						</div>
						<span class="font-medium text-ink">{formatPrice(cp.price * cp.quantity, cp.product.currency)}</span>
					</div>
				{/each}
				<div class="pt-3 border-t border-hairline flex items-center justify-between">
					<span class="font-bold text-ink">Total</span>
					<span class="font-bold text-ember text-lg">{totalFormatted}</span>
				</div>
			</div>

			<form onsubmit={handleSubmit} class="bg-card border border-hairline rounded-card p-6 space-y-5">
				<h2 class="text-lg font-semibold text-ink">Tus datos</h2>

				<div>
					<label for="name" class="block text-sm font-medium text-body mb-1.5">Nombre</label>
					<input
						id="name"
						type="text"
						required
						bind:value={name}
						placeholder="Tu nombre"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
				</div>

				<div>
					<label for="phone" class="block text-sm font-medium text-body mb-1.5">Número de WhatsApp</label>
					<input
						id="phone"
						type="tel"
						required
						bind:value={phone}
						placeholder="Ej: +53 12345678"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
				</div>

				<div>
					<label for="notes" class="block text-sm font-medium text-body mb-1.5">Notas <span class="text-muted-soft">(opcional)</span></label>
					<textarea
						id="notes"
						bind:value={notes}
						rows="2"
						placeholder="Ej: Entregar por la tarde"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
					></textarea>
				</div>

				<button
					type="submit"
					disabled={sending}
					class="w-full flex items-center justify-center gap-2 bg-ember text-white px-6 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50"
				>
					<i class="ri-whatsapp-line text-lg"></i>
					{sending ? 'Preparando pedido...' : 'Enviar pedido por WhatsApp'}
				</button>
			</form>
		</div>
	{/if}
</section>
