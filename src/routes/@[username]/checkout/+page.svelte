<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { clearUtm, formatPrice, generateStoreCode, loadUtm, utmQuery, waLink, variantPrice, productStock, isOutOfStock } from '$lib/utils';
	import { displayCurrency as viewCurrency, displayPrice } from '$lib/stores/currency.svelte';
	import { track } from '$lib/analytics';
	import type { DeliveryZone, PaymentMethod, Product, Store, Variant } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	let name = $state('');
	let phone = $state('');
	let notes = $state('');
	let sending = $state(false);
	let orderError = $state('');
	let orderPlaced = $state(false);
	let askValues = $state<Record<string, string>>({});
	let selectedPayment = $state<PaymentMethod | null>(null);
	let deliveryZone = $state<DeliveryZone | null>(null);
	let receiptFile = $state<File | null>(null);
	let receiptUrl = $state('');
	let receiptUploading = $state(false);
	let copyFeedback = $state<string | null>(null);

	const mode = $derived(data.store.action === 'whatsapp' ? 'whatsapp' : 'sin_contactar');
	const payments = $derived(
		mode === 'sin_contactar' && Array.isArray(data.store.payments) ? data.store.payments : [],
	);
	const deliveryZones = $derived(
		data.store.delivery?.enabled ? (data.store.delivery?.zones ?? []) : [],
	);
	const deliveryCost = $derived(deliveryZone?.price ?? 0);

	const BANK_LABELS: Record<string, string> = {
		bpa: 'Banco Popular de Ahorro',
		bandec: 'Banco de Crédito y Comercio',
		metropolitano: 'Banco Metropolitano',
		monedero: 'Monedero MiTransfer',
	};
	function bankLabel(id: string): string {
		return BANK_LABELS[id] ?? id;
	}
	function bankImageUrl(id: string): string {
		return `/banks/${id}.png`;
	}

	async function copyText(text: string, label: string) {
		try {
			await navigator.clipboard.writeText(text);
			copyFeedback = label;
			setTimeout(() => {
				if (copyFeedback === label) copyFeedback = null;
			}, 1500);
		} catch {
			// sin permiso de portapapeles
		}
	}

	async function handleReceipt(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		receiptUploading = true;
		receiptFile = file;
		orderError = '';
		try {
			const { supabase } = await import('$lib/supabase/client');
			const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
			const path = `${data.store.slug}/${orderId}-${Date.now()}.${ext}`;
			const { error } = await supabase.storage
				.from('comprobantes')
				.upload(path, file, { upsert: false, contentType: file.type });
			if (error) {
				receiptFile = null;
				receiptUrl = '';
				orderError = 'No se pudo subir el comprobante. Intenta de nuevo.';
				return;
			}
			receiptUrl = supabase.storage.from('comprobantes').getPublicUrl(path).data.publicUrl;
		} catch {
			receiptFile = null;
			receiptUrl = '';
			orderError = 'No se pudo subir el comprobante. Intenta de nuevo.';
		} finally {
			receiptUploading = false;
		}
	}

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
				cartProductsCache[row.id] = { ...row, variants: (Array.isArray(row.variants) ? row.variants : []) as unknown as Variant[], images: (Array.isArray(row.images) ? row.images : []) as unknown as string[], ask: (Array.isArray(row.ask) ? row.ask : []) as string[] };
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

	let total = $derived(
		cartLines.reduce((sum, cp) => sum + cp.display * cp.quantity, 0) + displayPrice(deliveryCost, data.store),
	);
	let totalFormatted = $derived(formatPrice(total, viewCurrency(data.store)));
	let cartEmpty = $derived(cartLines.length === 0);
	let orderCurrency = $derived(viewCurrency(data.store));

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
				? [`🚚 Mensajería: ${deliveryZone.name} — ${formatPrice(displayPrice(deliveryZone.price, data.store), currency)}`, ``]
				: []),
			`📍 Total: *${totalFormatted}*`,
			`👤 ${name}`,
			`📱 ${phone}`,
			...(selectedPayment
				? [
						`💳 Pago: ${selectedPayment.type === 'transfermovil' ? 'Transfermóvil' : 'EnZona'} (${bankLabel(selectedPayment.bank)})${receiptUrl ? `\n   Comprobante: ${receiptUrl}` : ''}`,
						``,
					]
				: []),
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

		if (payments.length > 0 && !selectedPayment) {
			orderError = 'Elige un método de pago para continuar.';
			return;
		}
		if (payments.length > 0 && !receiptUrl) {
			orderError = 'Falta subir el comprobante del pago.';
			return;
		}

		sending = true;
		orderError = '';
		const msg = buildWhatsAppMessage();
		const wa = data.store.whatsapp;

		track('begin_checkout', {
			value: total,
			currency: orderCurrency,
			num_items: cartLines.length,
		});

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
					currency: orderCurrency,
					utm_source: utm.utm_source ?? null,
					utm_medium: utm.utm_medium ?? null,
					utm_campaign: utm.utm_campaign ?? null,
					...(selectedPayment ? { payment: selectedPayment as unknown as import('$lib/database.types').Json } : {}),
					...(receiptUrl ? { payment_receipt: receiptUrl } : {}),
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
	{:else if mode === 'whatsapp' && !data.store.whatsapp}
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
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
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
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
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
										onchange={() => (deliveryZone = null)}
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
											onchange={() => (deliveryZone = z)}
											class="w-4 h-4 accent-ember cursor-pointer"
										/>
										{z.name}
									</span>
									<span class="font-medium">{formatPrice(displayPrice(z.price, data.store), viewCurrency(data.store))}</span>
								</label>
							{/each}
						</div>
						{#if data.store.delivery?.note}
							<p class="text-xs text-muted-soft mt-1.5">{data.store.delivery.note}</p>
						{/if}
					</div>
				{/if}

				{#if payments.length > 0}
					<div>
						<p class="text-sm font-medium text-body mb-2">Pago</p>
						<p class="text-xs text-muted-soft mb-2.5">
							Realiza la transferencia, copia tus datos y sube el comprobante (debe verse fecha, hora y nº de transacción).
						</p>
						<div class="space-y-2">
							{#each payments as pm}
								<label
									class="block border border-hairline rounded-btn p-3 cursor-pointer transition-colors hover:border-ember/50 {selectedPayment?.id === pm.id ? 'border-ember/60 bg-ember/5' : ''}"
								>
									<div class="flex items-start gap-3">
										<input
											type="radio"
											name="payment"
											checked={selectedPayment?.id === pm.id}
											onchange={() => (selectedPayment = pm)}
											class="mt-1 w-4 h-4 accent-ember cursor-pointer"
										/>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2.5">
												<span class="relative h-10 w-10 rounded-btn overflow-hidden border border-hairline bg-bone flex items-center justify-center text-[9px] font-bold text-muted uppercase flex-shrink-0">
													{bankLabel(pm.bank).slice(0, 6)}
													<img
														src={bankImageUrl(pm.bank)}
														alt={bankLabel(pm.bank)}
														class="absolute inset-0 h-full w-full object-cover"
														loading="lazy"
														onerror={(e) => e.currentTarget.remove()}
													/>
												</span>
												<div class="min-w-0">
													<p class="text-sm font-semibold text-ink truncate">
														{pm.type === 'transfermovil' ? 'Transfermóvil' : 'EnZona'} · {bankLabel(pm.bank)}
													</p>
													{#if pm.name}
														<p class="text-xs text-muted-soft truncate">{pm.name}</p>
													{/if}
												</div>
											</div>
											<div class="mt-2 space-y-1.5">
												{#if pm.bank === 'monedero'}
													<div class="flex items-center gap-2">
														<p class="flex-1 min-w-0 text-xs font-mono text-ink bg-bone border border-hairline rounded-btn px-2.5 py-1.5 truncate">
															📱 {pm.phone || pm.account}
														</p>
														<button
															type="button"
															onclick={(e) => {
																e.preventDefault();
																copyText(pm.phone || pm.account, `tel-${pm.id}`);
															}}
															class="flex-shrink-0 px-2.5 py-1.5 border border-hairline rounded-btn text-xs font-medium text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
														>
															{copyFeedback === `tel-${pm.id}` ? 'Copiado' : 'Copiar'}
														</button>
													</div>
												{:else}
												<div class="flex items-center gap-2">
													<p class="flex-1 min-w-0 text-xs font-mono text-ink bg-bone border border-hairline rounded-btn px-2.5 py-1.5 truncate">
														{pm.account}
													</p>
													<button
														type="button"
														onclick={(e) => {
															e.preventDefault();
															copyText(pm.account, `cuenta-${pm.id}`);
														}}
														class="flex-shrink-0 px-2.5 py-1.5 border border-hairline rounded-btn text-xs font-medium text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
													>
														{copyFeedback === `cuenta-${pm.id}` ? 'Copiado' : 'Copiar'}
													</button>
												</div>
												{#if pm.phone}
													<div class="flex items-center gap-2">
														<p class="flex-1 min-w-0 text-xs font-mono text-ink bg-bone border border-hairline rounded-btn px-2.5 py-1.5 truncate">
															{pm.phone}
														</p>
														<button
															type="button"
															onclick={(e) => {
																e.preventDefault();
																copyText(pm.phone, `tel-${pm.id}`);
															}}
															class="flex-shrink-0 px-2.5 py-1.5 border border-hairline rounded-btn text-xs font-medium text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
														>
															{copyFeedback === `tel-${pm.id}` ? 'Copiado' : 'Copiar'}
														</button>
													</div>
												{/if}
												{/if}
											</div>
										</div>
									</div>
								</label>
							{/each}
						</div>

						<div class="mt-3">
							<p class="text-sm font-medium text-body mb-1.5">Comprobante de pago</p>
							{#if receiptUrl}
								<div class="flex items-center justify-between gap-2 border border-hairline rounded-btn px-3.5 py-2.5 bg-bone">
									<span class="flex items-center gap-2 text-sm text-body min-w-0">
										<i class="ri-checkbox-circle-line text-ember flex-shrink-0"></i>
										<span class="truncate">{receiptFile?.name ?? 'Comprobante subido'}</span>
									</span>
									<button
										type="button"
										onclick={() => {
											receiptFile = null;
											receiptUrl = '';
										}}
										class="flex-shrink-0 text-xs font-medium text-muted hover:text-error transition-colors cursor-pointer"
									>
										Quitar
									</button>
								</div>
							{:else}
								<label
									class="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-bone border border-dashed border-hairline rounded-btn text-sm text-muted hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
								>
									{#if receiptUploading}
										<i class="ri-loader-4-line animate-spin"></i>
										Subiendo...
									{:else}
										<i class="ri-image-add-line"></i>
										Subir foto del comprobante
									{/if}
									<input type="file" accept="image/*" class="hidden" disabled={receiptUploading} onchange={handleReceipt} />
								</label>
								<p class="text-xs text-muted-soft mt-1.5">Debe verse la fecha, la hora y el nº de transacción.</p>
							{/if}
						</div>
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
					class="w-full flex items-center justify-center gap-2 bg-ember text-white px-6 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50"
				>
					{#if sending}
						<i class="ri-loader-4-line animate-spin"></i>
					{:else if mode === 'whatsapp'}
						<i class="ri-whatsapp-line text-lg"></i>
					{/if}
					{sending ? 'Preparando pedido...' : mode === 'whatsapp' ? 'Enviar pedido por WhatsApp' : 'Enviar pedido'}
				</button>
			</form>
		</div>
	{/if}
</section>
