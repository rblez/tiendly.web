<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { clearUtm, formatPrice, generateStoreCode, loadUtm, utmQuery, waLink, variantPrice, productStock, isOutOfStock } from '$lib/utils';
	import { displayCurrency as viewCurrency, displayPrice } from '$lib/stores/currency.svelte';
	import { couponStore } from '$lib/stores/coupon.svelte';
	import { couponDiscount, couponLabelText } from '$lib/coupons';
	import { track } from '$lib/analytics';
	import { migratePayment } from '$lib/payments';
	import type { DeliveryZone, Product, Store, Variant } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	let name = $state('');
	let phone = $state('');
	let notes = $state('');
	let sending = $state(false);
	let orderError = $state('');
	let orderPlaced = $state(false);
	let askValues = $state<Record<string, string>>({});
	let deliveryZone = $state<DeliveryZone | null>(null);
	let customZone = $state('');

	const configuredPaymentMethods = $derived(
		(Array.isArray(data.store.payments) ? data.store.payments : [])
			.map((payment) => migratePayment(payment))
			.filter((payment) => payment !== null),
	);
	const mode = $derived(
		data.store.action === 'whatsapp' || configuredPaymentMethods.length === 0 ? 'whatsapp' : 'sin_contactar',
	);
	const deliveryZones = $derived(
		data.store.delivery?.enabled && data.store.delivery?.mode !== 'pickup'
			? (data.store.delivery?.zones ?? [])
			: [],
	);
	const orderCurrency = $derived(viewCurrency(data.store));
	function deliveryPrice(zone: DeliveryZone | null) {
		if (!zone) return 0;
		if (orderCurrency === 'USD' && zone.usd !== undefined) return zone.usd ?? 0;
		if (orderCurrency === 'CUP' && zone.cup !== undefined) return zone.cup ?? 0;
		return zone.price ?? 0;
	}
	const deliveryCost = $derived(deliveryPrice(deliveryZone));

	const askFields = $derived.by(() => {
		const seen = new Set<string>();
		const out: { key: string; productId: string; label: string }[] = [];
		for (const cp of cartLines) {
			for (const label of cp.product.ask ?? []) {
				const key = `${cp.productId}::${label}`;
				if (seen.has(key)) continue;
				seen.add(key);
				out.push({ key, productId: cp.productId, label });
			}
		}
		return out;
	});

	const askMissing = $derived(askFields.filter((f) => !(askValues[f.key] ?? '').trim()));

	// id de pedido: se genera al abrir el checkout y queda en la URL para rastreo
	let orderId = $state('');

	$effect(() => {
		if (orderId) return;
		const existing = $page.url.searchParams.get('id');
		if (existing) {
			orderId = existing;
			return;
		}
		const code = generateStoreCode();
		orderId = code;
		goto(`/@${data.store.slug}/checkout?id=${code}`, { replaceState: true });
	});

	$effect(() => {
		couponStore.sync(data.store.slug);
	});

	function findProduct(id: string): Product | null {
		return cartProductsCache[id] ?? null;
	}

	// Products cache: fetched lazily on mount for cart items
	let cartProductsCache = $state<Record<string, Product>>({});
	let cacheReady = $state(false);

	$effect(() => {
		const slug = data.store.slug;
		cartProductsCache = {};
		cacheReady = false;
		const items = cart.items.filter((i) => i.storeSlug === slug);
		if (items.length === 0) {
			cacheReady = true;
			return;
		}
		let cancelled = false;
		(async () => {
			const { supabase } = await import('$lib/supabase/client');
			const ids = items.map((i) => i.productId);
			try {
				const { data: rows, error } = await supabase.from('products').select('*').in('id', ids);
				if (error) throw error;
				if (cancelled) return;
				for (const row of rows ?? []) {
					cartProductsCache[row.id] = { ...row, variants: (Array.isArray(row.variants) ? row.variants : []) as unknown as Variant[], images: (Array.isArray(row.images) ? row.images : []) as unknown as string[], ask: (Array.isArray(row.ask) ? row.ask : []) as string[] };
				}
			} catch (e) {
				console.error('checkout load:', e);
			} finally {
				if (!cancelled) cacheReady = true;
			}
		})();
		return () => {
			cancelled = true;
		};
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
				const option = ci.optionId && variant
					? (variant.options ?? []).find((o) => o.id === ci.optionId) ?? null
					: null;
				const price = variantPrice(variant, ci.optionId, product.price);
				return {
					...ci,
					product,
					variant,
					option,
					price,
					label: variant ? (option && variant.options?.length ? variant.label + ' — ' + option.label : variant.label) : null,
					display: displayPrice(price, data.store),
				};
			})
			.filter((x): x is NonNullable<typeof x> => x !== null);
	});

	let appliedCoupon = $derived(couponStore.state.coupon);

	let subtotal = $derived(cartLines.reduce((sum, cp) => sum + cp.display * cp.quantity, 0));
	let discount = $derived(couponDiscount(appliedCoupon, subtotal));
	let total = $derived(subtotal + deliveryCost - discount);
	let totalFormatted = $derived(formatPrice(total, viewCurrency(data.store)));
	let cartEmpty = $derived(cartLines.length === 0);


	$effect(() => {
		if (cartEmpty && cacheReady && !orderPlaced) {
			goto(`/@${data.store.slug}`);
		}
	});

	function buildWhatsAppMessage(): string {
		const currency = viewCurrency(data.store);
		const items = cartLines.map((cp) => {
			const qty = cp.quantity > 1 ? ` x${cp.quantity}` : '';
			const variant = cp.label ? ` (${cp.label})` : '';
			const askList = (cp.product.ask ?? [])
				.map((label) => {
					const value = (askValues[`${cp.productId}::${label}`] ?? '').trim();
					return value ? `\n   · ${label}: ${value}` : '';
				})
				.join('');
			return `▸ ${cp.product.name}${variant}${qty} — ${formatPrice(cp.display * cp.quantity, currency)}${askList}`;
		});

		const lines = [
			`Hola ${data.store.name} 👋`,
			``,
			`Quiero hacer este pedido:`,
			...items,
			``,
			...(orderId ? [`🧾 Nº pedido: *${orderId}*`, ``] : []),
			...(deliveryZone
				? [`🚚 Mensajería: ${deliveryZone.name} — ${formatPrice(deliveryPrice(deliveryZone), currency)}`, ``]
				: []),
			...(appliedCoupon ? [`🎟️ Cupón ${appliedCoupon.code} (-${couponLabelText(appliedCoupon)})`, ``] : []),
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

		if (askMissing.length > 0) {
			orderError = `Falta completar: ${askMissing.map((f) => f.label).join(', ')}.`;
			return;
		}

		const sinStock = cartLines.find((cp) => {
			const stock = productStock(cp.product, cp.variantId ?? null, cp.optionId ?? null);
			return isOutOfStock(stock) || (typeof stock === 'number' && stock < cp.quantity);
		});
		if (sinStock) {
			const stock = productStock(sinStock.product, sinStock.variantId ?? null, sinStock.optionId ?? null);
			const txt = stock != null && stock > 0 ? `solo quedan ${stock} y pediste ${sinStock.quantity}.` : 'se agotó.';
			orderError = `«${sinStock.product.name}»${sinStock.label ? ` (${sinStock.label})` : ''} ${txt} Quítalo del carrito o reduce la cantidad.`;
			return;
		}

		sending = true;
		orderError = '';

		const items = cartLines.map((cp) => {
			const askObj: Record<string, string> = {};
			for (const label of cp.product.ask ?? []) {
				const v = (askValues[`${cp.productId}::${label}`] ?? '').trim();
				if (v) askObj[label] = v;
			}
			return {
				productId: cp.productId,
				variantId: cp.variantId ?? undefined,
				optionId: cp.optionId ?? undefined,
				quantity: cp.quantity,
				productName: cp.product.name,
				label: cp.label,
				price: cp.display,
				currency: orderCurrency,
				...(Object.keys(askObj).length > 0 ? { ask: askObj } : {}),
			};
		});

		track('begin_checkout', {
			value: total,
			currency: orderCurrency,
			num_items: cartLines.length,
		});

		const utm = loadUtm();

		if (mode === 'sin_contactar') {
			// el pedido se crea en el paso de pago, cuando el cliente confirme
			try {
				sessionStorage.setItem(
					`tiendly-pay-${data.store.slug}`,
					JSON.stringify({
						id: orderId || null,
						name: name.trim(),
						phone: phone.trim(),
						notes: notes.trim() || null,
						items,
						subtotal,
						discount,
						total,
						currency: orderCurrency,
						delivery: deliveryZone ?? null,
						coupon: appliedCoupon ? { code: appliedCoupon.code, type: appliedCoupon.type, value: appliedCoupon.value } : null,
						storeName: data.store.name,
						storeSlug: data.store.slug,
						utm: {
							utm_source: utm.utm_source ?? null,
							utm_medium: utm.utm_medium ?? null,
							utm_campaign: utm.utm_campaign ?? null,
						},
					}),
				);
			} catch {
				// sin sessionStorage (privado) → el paso de pago redirigirá de vuelta
			}
			const qs = utmQuery(utm);
			clearUtm();
			const pay = `/@${data.store.slug}/checkout/pay?id=${encodeURIComponent(orderId ?? '')}`;
			goto(qs ? `${pay}&${qs}` : pay);
			return;
		}

		const msg = buildWhatsAppMessage();
		const wa = data.store.whatsapp;

		let saved = true;
		try {
			const { supabase } = await import('$lib/supabase/client');
			// sin .select(): anon no tiene policy de SELECT en orders, el RETURNING fallaría con RLS
			if (appliedCoupon) {
				const { data: redeem, error: redeemError } = await supabase.rpc('redeem_coupon', {
					p_store_slug: data.store.slug,
					p_code: appliedCoupon.code,
				});
				const r = (redeem ?? {}) as { ok?: boolean; error?: string };
				if (redeemError || !r.ok) {
					orderError = `El cupón ${appliedCoupon.code} ya no es válido (${r.error ?? 'intenta de nuevo'}). Quítalo del carrito y vuelve a enviar.`;
					sending = false;
					return;
				}
			}
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
					currency: orderCurrency,
					coupon_code: appliedCoupon?.code ?? null,
					discount,
					utm_source: utm.utm_source ?? null,
					utm_medium: utm.utm_medium ?? null,
					utm_campaign: utm.utm_campaign ?? null,
					...(deliveryZone ? { delivery: deliveryZone as unknown as import('$lib/database.types').Json } : {}),
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
						currency: orderCurrency,
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
			orderError =
				mode === 'whatsapp'
					? 'No se pudo registrar tu pedido. Tu mensaje de WhatsApp se envió igualmente; vuelve a intentarlo si no lo recibes.'
					: 'No se pudo registrar tu pedido. Intenta de nuevo.';
			sending = false;
			if (mode === 'whatsapp') {
				try {
					window.open(waLink(wa ?? '', msg), '_blank');
				} catch {
					// popup bloqueado: el enlace va en el mensaje de error
				}
			}
			return;
		}

		setTimeout(() => {
			orderPlaced = true;
			track('purchase', {
				value: total,
				currency: orderCurrency,
				transaction_id: orderId ?? undefined,
				content_ids: items.map((i) => i.productId),
			});
			cart.clear();
			const qs = utmQuery(loadUtm());
			clearUtm();
			if (mode === 'whatsapp') {
				window.open(waLink(wa ?? '', msg), '_blank');
			}
			const thanks = `/@${data.store.slug}/thanks?order_id=${encodeURIComponent(orderId ?? '')}`;
			goto(qs ? `${thanks}&${qs}` : thanks);
		}, 1200);
	}
</script>

<svelte:head>
	<title>Completar pedido | {data.store.name}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	<h1 class="text-3xl sm:text-4xl font-black text-ink mb-10">Completar tu pedido</h1>

	{#if cartEmpty && !cacheReady}
		<div class="flex items-center justify-center py-section">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else if cartEmpty}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<i class="ri-shopping-bag-line text-3xl text-muted-soft mb-4 block"></i>
			<p class="text-lg text-muted mb-2">Tu carrito está vacío</p>
			<p class="text-sm text-muted-soft mb-6">Agrega productos al carrito y vuelve aquí para completar tu pedido.</p>
			<a
				href={`/@${data.store.slug}`}
				class="btn btn-3d btn-md no-underline"
			>
				Ver productos
			</a>
		</div>
		{:else if mode === 'whatsapp' && !data.store.whatsapp}
			<div class="text-center py-16 bg-card border border-hairline rounded-card">
				<i class="ri-whatsapp-line text-3xl text-muted-soft mb-4 block"></i>
				<p class="text-lg text-ink mb-2">Esta tienda aún no configuró WhatsApp</p>
				<p class="text-sm text-muted-soft mb-6">Elige otra tienda o vuelve más tarde para completar tu pedido.</p>
			<a
				href={`/@${data.store.slug}`}
				class="btn btn-3d btn-md no-underline"
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
						<span class="font-medium text-ink">{formatPrice(cp.display * cp.quantity, viewCurrency(data.store))}</span>
					</div>
				{/each}
				{#if deliveryZone}
					<div class="pt-3 border-t border-hairline flex items-center justify-between text-sm">
						<span class="text-body">Mensajería — {deliveryZone.name}</span>
						<span class="font-medium text-ink">{formatPrice(displayPrice(deliveryZone.price, data.store), viewCurrency(data.store))}</span>
					</div>
				{/if}
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
						class="input"
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
						class="input"
					/>
				</div>

				{#if askFields.length > 0}
					<div class="bg-bone rounded-btn p-4 space-y-3">
						<p class="text-sm font-medium text-body">Datos para tu pedido</p>
						{#each askFields as f}
							<div>
								<label for={`ask-${f.key}`} class="block text-sm text-body mb-1.5">
									{f.label}
									{#if !(askValues[f.key] ?? '').trim() && askMissing.some((m) => m.key === f.key)}
										<span class="text-error">(obligatorio)</span>
									{/if}
								</label>
								<input
									id={`ask-${f.key}`}
									type="text"
									required
									bind:value={askValues[f.key]}
									placeholder={`Tu ${f.label}`}
									class="input"
								/>
							</div>
						{/each}
					</div>
				{/if}

				<div>
					<label for="notes" class="block text-sm font-medium text-body mb-1.5">Notas <span class="text-muted-soft">(opcional)</span></label>
					<textarea
						id="notes"
						bind:value={notes}
						rows="2"
						placeholder="Ej: Entregar por la tarde"
						class="input resize-none"
					></textarea>
				</div>

				{#if deliveryZones.length > 0}
					<div>
						<p class="text-sm font-medium text-body mb-2">Mensajería</p>
						<div class="space-y-1.5">
							<label
								class="flex items-center justify-between gap-2 px-3.5 py-2.5 border border-hairline rounded-btn text-sm cursor-pointer transition-colors hover:border-ember/50"
							>
								<span class="flex items-center gap-2 text-body">
									<input
										type="radio"
										name="delivery"
										checked={deliveryZone === null}
										onchange={() => { deliveryZone = null; customZone = ''; }}
										class="w-4 h-4 accent-ember cursor-pointer"
									/>
									Recoger en tienda
								</span>
								<span class="text-muted-soft">Gratis</span>
							</label>
							{#each deliveryZones as z}
								<label
									class="flex items-center justify-between gap-2 px-3.5 py-2.5 border border-hairline rounded-btn text-sm cursor-pointer transition-colors hover:border-ember/50"
								>
									<span class="flex items-center gap-2 text-body">
										<input
											type="radio"
											name="delivery"
											checked={deliveryZone?.name === z.name}
											onchange={() => { deliveryZone = z; customZone = ''; }}
											class="w-4 h-4 accent-ember cursor-pointer"
										/>
										{z.name}
									</span>
									<span class="font-medium">{formatPrice(deliveryPrice(z), orderCurrency)}</span>
								</label>
							{/each}
						</div>
						{#if data.store.delivery?.request_other_zone}
							<label class="mt-3 block text-xs font-medium text-body">
								¿No ves tu zona? Solicitar otra zona
								<input type="text" bind:value={customZone} oninput={() => (deliveryZone = customZone.trim() ? { name: customZone.trim(), cup: 0, usd: 0, price: 0 } : null)} placeholder="Escribe tu zona" class="input input-sm mt-1.5" />
							</label>
							{#if customZone.trim()}<p class="mt-1.5 text-xs text-muted-soft">El costo de esta zona será confirmado por la tienda.</p>{/if}
						{/if}
{#if data.store.delivery?.note}
						<p class="text-xs text-muted-soft mt-1.5">{data.store.delivery.note}</p>
					{/if}
				</div>
			{/if}



			{#if orderError}
					<div class="flex items-start gap-2 bg-error/10 text-error border border-error/30 rounded-btn px-4 py-3 text-sm">
						<i class="ri-alert-line mt-0.5 flex-shrink-0"></i>
						<span>{orderError}</span>
					</div>
				{/if}

				<button
					type="submit"
					disabled={sending}
					class="btn btn-3d btn-lg w-full disabled:opacity-50"
				>
					{#if sending}
						<i class="ri-loader-4-line animate-spin"></i>
					{:else if mode === 'whatsapp'}
						<i class="ri-whatsapp-line text-lg"></i>
					{/if}
					{sending ? 'Preparando pedido...' : mode === 'whatsapp' ? 'Enviar pedido por WhatsApp' : 'Continuar al pago'}
				</button>
			</form>
		</div>
	{/if}
</section>
