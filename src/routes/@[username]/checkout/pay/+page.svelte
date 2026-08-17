<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice, clearUtm, loadUtm, utmQuery } from '$lib/utils';
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
		currency: string;
		delivery: { name: string; price: number } | null;
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
	let copyFeedback = $state<string | null>(null);
	let sending = $state(false);
	let orderError = $state('');
	let orderPlaced = $state(false);

	const payments = $derived(
		(Array.isArray(data.store.payments) ? data.store.payments : [])
			.map((p) => migratePayment(p))
			.filter((p): p is PaymentMethod => p !== null),
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
		if (payments.length > 0) {
			selectedPayment = payments[0] as PaymentMethod;
		}
		draftReady = true;
		loading = false;
	});

	const rendered = $derived(selectedPayment ? renderPayment(selectedPayment) : null);

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

		if (payments.length > 0 && !selectedPayment) {
			orderError = 'Elige un método de pago para continuar.';
			return;
		}
		if (payments.length > 0 && !receiptUrl) {
			orderError = 'Sube el comprobante del pago antes de confirmar.';
			return;
		}

		sending = true;
		orderError = '';

		try {
			const { supabase } = await import('$lib/supabase/client');
			const draftItems = draft.items as PayDraftItem[];
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
				utm_source: draft.utm.utm_source ?? null,
				utm_medium: draft.utm.utm_medium ?? null,
				utm_campaign: draft.utm.utm_campaign ?? null,
				...(selectedPayment ? { payment: selectedPayment as unknown as import('$lib/database.types').Json } : {}),
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
			content_ids: draft.items.map((i) => i.productId),
		});
		try {
			sessionStorage.removeItem(`tiendly-pay-${data.store.slug}`);
			sessionStorage.setItem(
				`tiendly-order-${data.store.slug}`,
				JSON.stringify({
					id: draft.id || null,
					name: draft.name,
					phone: draft.phone,
					items: draft.items,
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
		const thanks = `/@${data.store.slug}/thanks?order_id=${encodeURIComponent(draft.id ?? '')}`;
		goto(qs ? `${thanks}&${qs}` : thanks);
	}
</script>

<svelte:head>
	<title>Pagar pedido | {data.store.name}</title>
</svelte:head>

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	{#if loading || !draft}
		<div class="flex items-center justify-center py-20">
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
				<h1 class="text-2xl sm:text-3xl font-bold text-ink">Paga tu pedido</h1>
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
			<div class="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
				<span class="text-sm font-bold text-ink">Total</span>
				<span class="text-lg font-black text-ember tabular-nums">{formatPrice(draft.total, draft.currency)}</span>
			</div>
		</div>

		{#if payments.length > 0}
			<div class="bg-card border border-hairline rounded-card p-4 sm:p-6 mb-6">
				<h2 class="text-lg font-bold text-ink mb-1">Elige cómo pagar</h2>
				<p class="text-xs text-muted-soft mb-4">Copia los datos del método que elijas, paga y sube el comprobante.</p>

				<div class="space-y-2 mb-5">
					{#each payments as pm}
						<button
							type="button"
							onclick={() => (selectedPayment = pm)}
							class="w-full flex items-center gap-2.5 px-3.5 py-3 border rounded-btn text-left transition-colors cursor-pointer {selectedPayment?.id === pm.id
								? 'border-ember/60 bg-ember/5'
								: 'border-hairline hover:border-ember/50 hover:bg-bone'}"
						>
							<span class="h-9 w-9 flex items-center justify-center rounded-btn bg-bone border border-hairline text-[11px] font-black text-ember uppercase flex-shrink-0">
								{pm.title.slice(0, 4)}
							</span>
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

				<div class="mt-5">
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
			<div class="flex items-start gap-2 bg-error/10 text-error border border-error/30 rounded-btn px-4 py-3 text-sm mb-4">
				<i class="ri-alert-line mt-0.5 flex-shrink-0"></i>
				<span>{orderError}</span>
			</div>
		{/if}

		<button
			onclick={confirmPayment}
			disabled={sending || orderPlaced}
			class="w-full flex items-center justify-center gap-2 bg-ember text-white px-6 py-3.5 rounded-btn text-base font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50"
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