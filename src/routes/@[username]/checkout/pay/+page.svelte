<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice, clearUtm, loadUtm, utmQuery, waLink } from '$lib/utils';
	import { track } from '$lib/analytics';
	import { migratePayment, renderPayment } from '$lib/payments';
	import type { PaymentMethod, Store } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	interface PayDraftItem {
		productId: string;
		variantId?: string;
		optionId?: string;
		quantity: number;
		productName: string;
		label?: string | null;
		price: number;
		currency: string;
		ask?: Record<string, string>;
	}
	interface PayDraft {
		id: string | null;
		name: string;
		phone: string;
		notes: string | null;
		items: PayDraftItem[];
		total: number;
		discount?: number;
		currency: string;
		delivery: { name: string; price: number } | null;
		coupon?: { code: string; type: string; value: number } | null;
		storeName: string;
		storeSlug: string;
		utm: { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null };
	}

	const mode = $derived(data.store.action === 'whatsapp' ? 'whatsapp' : 'sin_contactar');

	let draft = $state<PayDraft | null>(null);
	let loading = $state(true);
	let selectedPayment = $state<PaymentMethod | null>(null);
	let receiptFile = $state<File | null>(null);
	let receiptUrl = $state('');
	let receiptUploading = $state(false);
	let proofReference = $state('');
	let copyFeedback = $state<string | null>(null);
	let sending = $state(false);
	let orderError = $state('');
	let orderPlaced = $state(false);

	const payments = $derived(
		(Array.isArray(data.store.payments) ? data.store.payments : [])
			.map((p) => migratePayment(p))
			.filter((p): p is PaymentMethod => p !== null),
	);
	const availablePayments = $derived(
		payments.filter((pm) => !pm.currency || pm.currency === 'ambas' || pm.currency === draft?.currency),
	);

	let draftReady = false;

	$effect(() => {
		if (draftReady) return;
		if (mode === 'whatsapp') {
			goto(`/@${data.store.slug}/checkout`);
			return;
		}
		let saved: PayDraft | null = null;
		try {
			const raw = sessionStorage.getItem(`tiendly-pay-${data.store.slug}`);
			saved = raw ? (JSON.parse(raw) as PayDraft) : null;
		} catch {
			saved = null;
		}
		if (!saved || !Array.isArray(saved.items) || saved.items.length === 0) {
			goto(`/@${data.store.slug}/checkout`);
			return;
		}
		draft = saved;
		if (availablePayments.length > 0) {
			selectedPayment = availablePayments[0];
		}
		draftReady = true;
		loading = false;
	});

	const rendered = $derived(selectedPayment ? renderPayment(selectedPayment) : null);

	// El vendedor ya fijó el tipo de comprobante en Ajustes > Pagos.
	// El comprador no elige: solo ve lo que corresponde a su método de pago.
	const proofType = $derived(selectedPayment?.proof_type ?? 'captura');
	const needsPhoto = $derived(proofType === 'captura' || proofType === 'captura_y_tx');
	const needsReference = $derived(proofType === 'captura_y_tx' || proofType === 'hash');
	const referenceLabel = $derived(proofType === 'hash' ? 'Hash de la transacción' : 'Número de transacción');
	const referencePlaceholder = $derived(proofType === 'hash' ? 'Ej. 0xabc123...' : 'Ej. TX-12345');
	const proofComplete = $derived(
		availablePayments.length === 0 ||
			(!!selectedPayment && (!needsPhoto || !!receiptUrl) && (!needsReference || proofReference.trim().length > 0)),
	);

	function selectPayment(pm: PaymentMethod) {
		if (selectedPayment?.id === pm.id) return;
		selectedPayment = pm;
		// Cada método puede exigir un comprobante distinto: no arrastramos datos previos.
		receiptFile = null;
		receiptUrl = '';
		proofReference = '';
		orderError = '';
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
		if (!file || !draft) return;
		receiptUploading = true;
		receiptFile = file;
		orderError = '';
		try {
			const { supabase } = await import('$lib/supabase/client');
			const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
			const path = `${data.store.slug}/${draft.id ?? 'pedido'}-${Date.now()}.${ext}`;
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

	async function confirmPayment() {
		if (!draft || sending || orderPlaced) return;

		if (availablePayments.length > 0 && !selectedPayment) {
			orderError = 'Elige un método de pago para continuar.';
			return;
		}
		if (availablePayments.length > 0 && needsPhoto && !receiptUrl) {
			orderError = 'Sube la foto del comprobante antes de confirmar.';
			return;
		}
		if (availablePayments.length > 0 && needsReference && !proofReference.trim()) {
			orderError = `Escribe el ${referenceLabel.toLowerCase()} antes de confirmar.`;
			return;
		}

		sending = true;
		orderError = '';

		const draftItems = draft.items as PayDraftItem[];

		try {
			const { supabase } = await import('$lib/supabase/client');
			if (draft.coupon) {
				const { data: redeem, error: redeemError } = await supabase.rpc('redeem_coupon', {
					p_store_slug: data.store.slug,
					p_code: draft.coupon.code,
				});
				const r = (redeem ?? {}) as { ok?: boolean; error?: string };
				if (redeemError || !r.ok) {
					orderError = `El cupón ${draft.coupon.code} ya no es válido (${r.error ?? 'intenta de nuevo'}). Vuelve al carrito y quítalo para continuar.`;
					sending = false;
					return;
				}
			}
			// sin .select(): anon no tiene policy de SELECT en orders, el RETURNING fallaría con RLS
			const { error: err } = await supabase.from('orders').insert({
				store_id: data.store.id,
				code: draft.id || null,
				customer_name: draft.name,
				customer_phone: draft.phone,
				notes: draft.notes || null,
				items: draftItems.map((it) => ({
					productId: it.productId,
					variantId: it.variantId ?? undefined,
					optionId: it.optionId ?? undefined,
					quantity: it.quantity,
					productName: it.productName,
					label: it.label ?? undefined,
					price: it.price,
					currency: it.currency,
					...(it.ask && Object.keys(it.ask).length > 0 ? { ask: it.ask } : {}),
				})) as unknown as import('$lib/database.types').Json,
				total: draft.total,
				currency: draft.currency,
				coupon_code: draft.coupon?.code ?? null,
				discount: draft.discount ?? 0,
				utm_source: draft.utm.utm_source ?? null,
				utm_medium: draft.utm.utm_medium ?? null,
				utm_campaign: draft.utm.utm_campaign ?? null,
					...(selectedPayment ? { payment: { ...selectedPayment, proof_type: proofType, proof_reference: proofReference.trim() || null } as unknown as import('$lib/database.types').Json } : {}),
					...(receiptUrl ? { payment_receipt: receiptUrl } : {}),
				...(draft.delivery ? { delivery: draft.delivery as unknown as import('$lib/database.types').Json } : {}),
			});
			if (err) {
				console.error('orders insert (pay):', err);
				orderError = 'No se pudo registrar tu pedido. Intenta de nuevo.';
				sending = false;
				return;
			}
		} catch {
			orderError = 'No se pudo registrar tu pedido. Intenta de nuevo.';
			sending = false;
			return;
		}

		orderPlaced = true;
		track('purchase', {
			value: draft.total,
			currency: draft.currency,
			transaction_id: draft.id ?? undefined,
			content_ids: draftItems.map((i) => i.productId),
		});
		try {
			sessionStorage.removeItem(`tiendly-pay-${data.store.slug}`);
			sessionStorage.setItem(
				`tiendly-order-${data.store.slug}`,
				JSON.stringify({
					id: draft.id || null,
					name: draft.name,
					phone: draft.phone,
					items: draftItems,
					total: draft.total,
					currency: draft.currency,
					storeName: data.store.name,
					storeSlug: data.store.slug,
				}),
			);
		} catch {
			// sin sessionStorage
		}
		cart.clear();
		const qs = utmQuery(loadUtm());
		clearUtm();
		try {
			window.open(waLink(data.store.whatsapp ?? '', sellerNotice()), '_blank');
		} catch {
			// popup bloqueado: al vendedor le llega el pedido por el panel igualmente
		}
		const thanks = `/@${data.store.slug}/thanks?order_id=${encodeURIComponent(draft.id ?? '')}`;
		goto(qs ? `${thanks}&${qs}` : thanks);
	}

	function sellerNotice(): string {
		if (!draft) return '';
		const currency = draft.currency;
		const items = draft.items
			.map((it) => `▸ ${it.productName}${it.label ? ` (${it.label})` : ''}${it.quantity > 1 ? ` x${it.quantity}` : ''} — ${formatPrice(it.price * it.quantity, currency)}`)
			.join('\n');
		const pmTitle = rendered?.title;
		return [
			`Hola ${data.store.name} 👋`,
			``,
			`*He acabado de pagar* y envié el comprobante:`,
			``,
			...(draft.id ? [`🧾 Nº pedido: *${draft.id}*`, ``] : []),
			items,
			``,
			...(draft.delivery ? [`🚚 Mensajería: ${draft.delivery.name} — ${formatPrice(draft.delivery.price, currency)}`, ``] : []),
			...(draft.coupon ? [`🎟️ Cupón ${draft.coupon.code} (-${formatPrice(draft.discount ?? 0, currency)})`, ``] : []),
			`📍 Total: *${formatPrice(draft.total, currency)}*`,
			`👤 ${draft.name}`,
			`📱 ${draft.phone}`,
			...(pmTitle ? [`💳 Pagué con: ${pmTitle}`, ``] : []),
			...(receiptUrl ? [`📎 Comprobante: ${receiptUrl}`, ``] : []),
			...(draft.notes ? [`📝 ${draft.notes}`, ``] : [``]),
			`Confírmalo en el panel de Tiendly ✅`,
		].join('\n');
	}
</script>

<svelte:head>
	<title>Pagar pedido | {data.store.name}</title>
</svelte:head>

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	{#if loading || !draft}
		<div class="flex items-center justify-center py-section">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else}
		<a href={`/@${data.store.slug}/checkout`} class="inline-flex items-center gap-1.5 text-sm text-body hover:text-ink transition-colors no-underline mb-6">
			<i class="ri-arrow-left-line"></i>
			Volver a tus datos
		</a>

		<div class="flex items-center gap-3 mb-8">
			<span class="h-11 w-11 flex items-center justify-center rounded-btn bg-ember/10 text-ember">
				<i class="ri-qr-scan-line text-xl"></i>
			</span>
			<div>
				<h1 class="text-3xl sm:text-4xl font-black text-ink">Paga tu pedido</h1>
				<p class="text-sm text-muted-soft">
					Pedido {draft.id ? `nº ${draft.id}` : 'sin número'}
					{draft.name ? ` · ${draft.name}` : ''}
				</p>
			</div>
		</div>

		<div class="bg-card border border-hairline rounded-card divide-y divide-hairline mb-6">
			{#each draft.items as it}
				<div class="px-4 sm:px-5 py-3 flex items-baseline justify-between gap-3">
					<p class="text-sm text-body min-w-0">
						<span class="font-medium text-ink">{it.quantity > 1 ? `${it.quantity}× ` : ''}{it.productName}</span>
						{#if it.label}
							<span class="text-muted-soft"> · {it.label}</span>
						{/if}
					</p>
					<span class="text-sm font-medium text-ink tabular-nums flex-shrink-0">
						{formatPrice(it.price * it.quantity, draft.currency)}
					</span>
				</div>
			{/each}
			{#if draft.delivery}
				<div class="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
					<span class="text-sm text-body">Mensajería — {draft.delivery.name}</span>
					<span class="text-sm font-medium text-ink tabular-nums">{formatPrice(draft.delivery.price, draft.currency)}</span>
				</div>
			{/if}
			{#if draft.coupon}
				<div class="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
					<span class="text-sm text-success">Cupón <span class="font-mono font-semibold">{draft.coupon.code}</span></span>
					<span class="text-sm font-medium text-success tabular-nums">-{formatPrice(draft.discount ?? 0, draft.currency)}</span>
				</div>
			{/if}
			<div class="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
				<span class="text-sm font-bold text-ink">Total</span>
				<span class="text-lg font-black text-ember tabular-nums">{formatPrice(draft.total, draft.currency)}</span>
			</div>
		</div>

		{#if availablePayments.length > 0}
			<div class="bg-card border border-hairline rounded-card p-4 sm:p-6 mb-6">
				<h2 class="text-lg font-bold text-ink mb-1">Elige cómo pagar</h2>
				<p class="text-xs text-muted-soft mb-4">Copia los datos del método que elijas, paga y confirma tu pedido.</p>

				<div class="space-y-2 mb-5">
					{#each availablePayments as pm}
						<button
							type="button"
							onclick={() => selectPayment(pm)}
							class="w-full flex items-center gap-2.5 px-3.5 py-3 border rounded-btn text-left transition-colors cursor-pointer {selectedPayment?.id === pm.id
								? 'border-ember/60 bg-ember/5'
								: 'border-hairline hover:border-ember/50 hover:bg-bone'}"
						>
								{#if pm.image}<img src={pm.image} alt="" class="h-9 w-9 rounded-btn object-cover border border-hairline flex-shrink-0" />{:else}<span class="h-9 w-9 flex items-center justify-center rounded-btn bg-bone border border-hairline text-[11px] font-black text-ember uppercase flex-shrink-0">{pm.title.slice(0, 4)}</span>{/if}
							<span class="flex-1 min-w-0">
								<span class="block text-sm font-semibold text-ink truncate">{pm.title}</span>
								<span class="block text-xs text-muted-soft truncate">{(pm.fields ?? []).filter((f) => f.value).length} datos para copiar</span>
							</span>
							<i class="ri-checkbox-circle-fill text-ember {selectedPayment?.id === pm.id ? '' : 'invisible'}"></i>
						</button>
					{/each}
				</div>

				{#if rendered}
					<div class="border border-hairline rounded-btn p-4 bg-bone">
						<p class="text-sm font-bold text-ink mb-3">{rendered.title}</p>
						<div class="space-y-2">
							{#each rendered.fields as f (f.label + f.value)}
								<div class="flex items-center gap-2">
									<p class="flex-1 min-w-0">
										<span class="block text-[11px] text-muted-soft">{f.label}</span>
										<span class="block text-xs font-mono text-ink bg-canvas border border-hairline rounded-btn px-2.5 py-1.5 truncate">{f.value}</span>
									</p>
									<button
										type="button"
										onclick={() => copyText(f.value, `f-${f.label}`)}
										class="flex-shrink-0 px-2.5 py-1.5 border border-hairline rounded-btn text-xs font-medium text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
									>
										{copyFeedback === `f-${f.label}` ? 'Copiado' : 'Copiar'}
									</button>
								</div>
							{/each}
						</div>
						{#if rendered.instructions}
							<div class="mt-3 pt-3 border-t border-hairline">
								<p class="text-[11px] font-medium text-body mb-1">Instrucciones</p>
								<p class="text-xs text-muted-soft leading-relaxed whitespace-pre-line">{rendered.instructions}</p>
							</div>
						{/if}
					</div>
				{/if}

				{#if proofType !== 'ninguno'}
				<div class="mt-5">
					<p class="text-sm font-medium text-body mb-1.5">Comprobante de pago</p>
					{#if needsPhoto}
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
								<input type="file" accept="image/*,.pdf,.heic,.webp" class="hidden" disabled={receiptUploading} onchange={handleReceipt} />
							</label>
							<p class="text-xs text-muted-soft mt-1.5">Requerido. Puedes subir una captura, factura o PDF.</p>
						{/if}
					{/if}
					{#if needsReference}
						<label class="block text-xs font-medium text-body {needsPhoto ? 'mt-4' : ''}">
							{referenceLabel} <span class="font-normal text-error">*</span>
							<input
								bind:value={proofReference}
								type="text"
								required
								placeholder={referencePlaceholder}
								class="input input-sm mt-1.5 w-full"
								autocomplete="off"
							/>
						</label>
					{/if}
				</div>
				{/if}
			</div>
		{/if}

		{#if orderError}
			<div class="flex items-start gap-2 bg-error/10 text-error border border-error/30 rounded-btn px-4 py-3 text-sm mb-4">
				<i class="ri-alert-line mt-0.5 flex-shrink-0"></i>
				<span>{orderError}</span>
			</div>
		{/if}

		<button
			onclick={confirmPayment}
			disabled={sending || orderPlaced || !proofComplete}
			class="btn btn-3d btn-lg w-full disabled:opacity-50"
		>
			{#if sending}
				<i class="ri-loader-4-line animate-spin"></i>
				Registrando...
			{:else}
				<i class="ri-check-double-line text-lg"></i>
				He pagado, enviar pedido
			{/if}
		</button>
		<p class="text-xs text-muted-soft text-center mt-3">
			Al confirmar, tu pedido queda registrado y la tienda lo revisará junto con tu comprobante.
		</p>
	{/if}
</section>
