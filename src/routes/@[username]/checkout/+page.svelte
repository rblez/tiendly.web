<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { clearUtm, formatPrice, generateStoreCode, loadUtm, utmQuery, waLink, convertPrice, vendorCurrency } from '$lib/utils';
	import { track } from '$lib/analytics';
	import type { Product, Store, Variant } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	let name = $state('');
	let phone = $state('');
	let notes = $state('');
	let sending = $state(false);
	let orderError = $state('');
	let orderPlaced = $state(false);

	// id de pedido: se genera al abrir el checkout y queda en la URL para rastreo
	let orderId = $state('');

	$effect(() => {
		if (orderId) return;
		const existing = $page.url.searchParams.get('id');
		if (existing) {
			orderId = existing;
			return;
		}
		const code = generateStoreCode(6);
		orderId = code;
		goto(`/@${data.store.slug}/checkout?id=${code}`, { replaceState: true });
	});

	function findProduct(id: string): Product | null {
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
				cartProductsCache[row.id] = { ...row, variants: (Array.isArray(row.variants) ? row.variants : []) as unknown as Variant[], images: (Array.isArray(row.images) ? row.images : []) as unknown as string[] };
			}
			cacheReady = true;
		})();
	});

	let cartLines = $derived.by(() => {
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
					display: convertPrice(variant ? variant.price : product.price, data.store),
				};
			})
			.filter((x): x is NonNullable<typeof x> => x !== null);
	});

	let total = $derived(cartLines.reduce((sum, cp) => sum + cp.display * cp.quantity, 0));
	let totalFormatted = $derived(formatPrice(total, vendorCurrency(data.store)));
	let cartEmpty = $derived(cartLines.length === 0);

	$effect(() => {
		if (cartEmpty && cacheReady && !orderPlaced) {
			goto(`/@${data.store.slug}`);
		}
	});

	function buildWhatsAppMessage(): string {
		const items = cartLines.map((cp) => {
			const qty = cp.quantity > 1 ? ` x${cp.quantity}` : '';
			const variant = cp.label ? ` (${cp.label})` : '';
			const currency = vendorCurrency(data.store);
			return `▸ ${cp.product.name}${variant}${qty} — ${formatPrice(cp.display * cp.quantity, currency)}`;
		});

		const lines = [
			`Hola ${data.store.name} 👋`,
			``,
			`Quiero hacer este pedido:`,
			...items,
			``,
			...(orderId ? [`🧾 Nº pedido: *${orderId}*`, ``] : []),
			`📍 Total: *${totalFormatted}*`,
			`👤 ${name}`,
			`📱 ${phone}`,
			...(notes.trim() ? [`📝 ${notes.trim()}`, ``] : [``]),
			...(utmLine() ? [utmLine(), ``] : [`¿Está disponible?`]),
		];

		return lines.join('\n');
	}

	function utmLine(): string {
		const u = loadUtm();
		const src = u.utm_source ?? '';
		if (!src) return '';
		const via = [u.utm_medium, u.utm_campaign].filter(Boolean).join(' · ');
		return `📣 Llegó desde ${src}${via ? ` (${via})` : ''}`;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name || !phone || sending) return;

		sending = true;
		orderError = '';
		const msg = buildWhatsAppMessage();
		const wa = data.store.whatsapp;

		track('begin_checkout', {
			value: total,
			currency: vendorCurrency(data.store),
			num_items: cartLines.length,
		});

		const items = cartLines.map((cp) => ({
			productId: cp.productId,
			variantId: cp.variantId ?? undefined,
			quantity: cp.quantity,
			productName: cp.product.name,
			label: cp.label,
			price: cp.display,
			currency: vendorCurrency(data.store),
		}));

		let saved = true;
		const utm = loadUtm();
		try {
			const { supabase } = await import('$lib/supabase/client');
			// sin .select(): anon no tiene policy de SELECT en orders, el RETURNING fallaría con RLS
			const { error: orderError2 } = await supabase
				.from('orders')
				.insert({
					store_id: data.store.id,
					code: orderId || null,
					customer_name: name.trim(),
					customer_phone: phone.trim(),
					notes: notes.trim() || null,
					items,
					total,
					currency: vendorCurrency(data.store),
					utm_source: utm.utm_source ?? null,
					utm_medium: utm.utm_medium ?? null,
					utm_campaign: utm.utm_campaign ?? null,
				});
			if (orderError2) {
				console.error('orders insert:', orderError2);
				saved = false;
			}
			try {
				sessionStorage.setItem(
					`tiendly-order-${data.store.slug}`,
					JSON.stringify({
						id: orderId || null,
						name: name.trim(),
						phone: phone.trim(),
						items,
						total,
						currency: vendorCurrency(data.store),
						storeName: data.store.name,
						storeSlug: data.store.slug,
					}),
				);
			} catch {
				// sin sessionStorage (privado) → solo WhatsApp
			}
		} catch {
			saved = false;
		}

		if (!saved) {
			orderError = 'No se pudo registrar tu pedido. Tu mensaje de WhatsApp se envió igualmente; vuelve a intentarlo si no lo recibes.';
			sending = false;
			try {
				window.open(waLink(wa ?? '', msg), '_blank');
			} catch {
				// popup bloqueado: el enlace va en el mensaje de error
			}
			return;
		}

		setTimeout(() => {
			orderPlaced = true;
			track('purchase', {
				value: total,
				currency: vendorCurrency(data.store),
				transaction_id: orderId ?? undefined,
				content_ids: items.map((i) => i.productId),
			});
			cart.clear();
const qs = utmQuery(loadUtm());
		clearUtm();
		window.open(waLink(wa ?? '', msg), '_blank');
		const thanks = `/@${data.store.slug}/thanks?order_id=${encodeURIComponent(orderId ?? '')}`;
		goto(qs ? `${thanks}&${qs}` : thanks);
		}, 1200);
	}
</script>

<svelte:head>
	<title>Completar pedido | {data.store.name}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	<h1 class="text-3xl sm:text-4xl font-bold text-ink mb-10">Completar tu pedido</h1>

	{#if cartEmpty && !cacheReady}
		<div class="flex items-center justify-center py-20">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else if cartEmpty}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<i class="ri-shopping-bag-line text-3xl text-muted-soft mb-4 block"></i>
			<p class="text-lg text-muted mb-2">Tu carrito está vacío</p>
			<p class="text-sm text-muted-soft mb-6">Agrega productos al carrito y vuelve aquí para completar tu pedido.</p>
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
			<p class="text-sm text-muted-soft mb-6">Vuelve más tarde o contacta a la tienda por otro medio.</p>
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
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-ink">Tu pedido</h2>
					{#if orderId}
						<span class="text-xs font-mono font-semibold text-muted-soft bg-bone px-2.5 py-1 rounded-full">Nº {orderId}</span>
					{/if}
				</div>
				{#each cartLines as cp}
					<div class="flex items-center justify-between text-sm">
						<div class="text-body">
							<span>{cp.product.name}</span>
							{#if cp.label}
								<span class="text-ember"> — {cp.label}</span>
							{/if}
							<span class="text-muted"> x{cp.quantity}</span>
						</div>
						<span class="font-medium text-ink">{formatPrice(cp.display * cp.quantity, vendorCurrency(data.store))}</span>
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

				{#if orderError}
					<div class="flex items-start gap-2 bg-error/10 text-error border border-error/30 rounded-btn px-4 py-3 text-sm">
						<i class="ri-alert-line mt-0.5 flex-shrink-0"></i>
						<span>{orderError}</span>
					</div>
				{/if}

				<button
					type="submit"
					disabled={sending}
					class="w-full flex items-center justify-center gap-2 bg-ember text-white px-6 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50"
				>
					{#if sending}
						<i class="ri-loader-4-line animate-spin"></i>
					{:else}
						<i class="ri-whatsapp-line text-lg"></i>
					{/if}
					{sending ? 'Preparando pedido...' : 'Enviar pedido por WhatsApp'}
				</button>
			</form>
		</div>
	{/if}
</section>
