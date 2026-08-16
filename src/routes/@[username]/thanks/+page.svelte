<script lang="ts">
	import { page } from '$app/stores';
	import { formatPrice } from '$lib/utils';
	import type { Store } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	type OrderSummary = {
		id: string | null;
		name: string;
		phone: string;
		items: {
			productId: string;
			variantId?: string;
			quantity: number;
			productName: string;
			label: string | null;
			price: number;
			currency: string;
		}[];
		total: number;
		currency: string;
		storeName: string;
		storeSlug: string;
	};

	let order = $state<OrderSummary | null>(null);
	let orderId = $state('');
	let copied = $state(false);

	const orderNumber = $derived((orderId || (order?.id ?? '').slice(0, 8)).toLowerCase());

	async function copyNumber() {
		if (!orderNumber) return;
		try {
			await navigator.clipboard.writeText(orderNumber);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			// sin permiso de portapapeles
		}
	}

	$effect.pre(() => {
		orderId = $page.url.searchParams.get('order_id') ?? '';
	});

	$effect(() => {
		if (typeof sessionStorage === 'undefined') return;
		const raw = sessionStorage.getItem(`tiendly-order-${data.store.slug}`);
		if (!raw) return;
		try {
			order = JSON.parse(raw) as OrderSummary;
		} catch {
			order = null;
		}
	});

	const storeMatches = $derived(order === null || order.storeSlug === data.store.slug);
</script>

<svelte:head>
	<title>Gracias por tu pedido | {data.store.name}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	{#if !order || !storeMatches}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<p class="text-lg text-muted mb-6">No encontramos ningún pedido reciente de esta tienda.</p>
			<a
				href={`/@${data.store.slug}`}
				class="inline-flex bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all no-underline"
			>
				Ver productos
			</a>
		</div>
	{:else}
		<div class="text-center mb-10">
			<h1 class="text-3xl sm:text-4xl font-bold text-ink mb-2">¡Gracias, {order.name}!</h1>
			<p class="text-body">
				Tu pedido fue registrado en
				<span class="font-semibold text-ink">{data.store.name}</span>
				y ya está en proceso. Te contactarán pronto para confirmar la entrega.
			</p>
			{#if orderNumber}
				<div class="mt-5 flex items-center justify-center gap-2">
					<p class="text-sm text-muted-soft">Nº de pedido:</p>
					<button
						onclick={copyNumber}
						class="inline-flex items-center gap-2 bg-bone border border-hairline rounded-btn px-3 py-1.5 text-sm font-mono font-semibold text-ink cursor-pointer transition-colors hover:border-ember/50 hover:text-ember"
						aria-label="Copiar número de pedido"
					>
						{orderNumber}
						<span class="text-xs font-sans font-medium text-ember">
							{copied ? 'Copiado ✓' : 'Copiar'}
						</span>
					</button>
				</div>
				<p class="text-xs text-muted-soft mt-2">Guarda este número para rastrear tu pedido por la tienda.</p>
			{/if}
		</div>

		<div class="bg-card border border-hairline rounded-card p-6 mb-6">
			<div class="flex items-center justify-between mb-4 pb-4 border-b border-hairline">
				<h2 class="text-lg font-semibold text-ink">Tu pedido</h2>
				{#if orderId || order.id}
					<span class="text-xs font-mono text-muted-soft">Nº {orderNumber}</span>
				{/if}
			</div>
			<div class="space-y-3">
				{#each order.items as item}
					<div class="flex items-center justify-between text-sm">
						<div class="text-body">
							<span>{item.productName}</span>
							{#if item.label}
								<span class="text-ember"> — {item.label}</span>
							{/if}
							<span class="text-muted"> x{item.quantity}</span>
						</div>
						<span class="font-medium text-ink">{formatPrice(item.price * item.quantity, item.currency)}</span>
					</div>
				{/each}
				<div class="pt-3 border-t border-hairline flex items-center justify-between">
					<span class="font-bold text-ink">Total</span>
					<span class="font-bold text-ember text-lg">{formatPrice(order.total, order.currency)}</span>
				</div>
			</div>
		</div>

		<div class="flex flex-col sm:flex-row justify-center gap-3">
			<a
				href={`/@${data.store.slug}`}
				class="inline-flex items-center justify-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline"
			>
				Seguir comprando
			</a>
			<a
				href={data.store.whatsapp ? `https://wa.me/${data.store.whatsapp}` : `/@${data.store.slug}`}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center justify-center gap-2 bg-card border border-hairline text-ink px-6 py-3 rounded-btn text-sm font-medium transition-colors no-underline"
			>
				<i class="ri-whatsapp-line text-[#25d366]"></i>
				Contactar por WhatsApp
			</a>
		</div>
	{/if}
</section>