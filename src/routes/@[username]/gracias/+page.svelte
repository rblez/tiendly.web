<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
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

	$effect.pre(() => {
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
			<i class="ri-store-2-line text-3xl text-muted-soft mb-4 block"></i>
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
			<div class="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-5">
				<i class="ri-check-line text-3xl text-ember"></i>
			</div>
			<h1 class="text-3xl sm:text-4xl font-bold text-ink mb-2">¡Gracias, {order.name}!</h1>
			<p class="text-body">
				Tu pedido fue enviado a
				<span class="font-semibold text-ink">{data.store.name}</span>
				por WhatsApp. Ellos te contactarán para confirmar la entrega.
			</p>
		</div>

		<div class="bg-card border border-hairline rounded-card p-6 mb-6">
			<div class="flex items-center justify-between mb-4 pb-4 border-b border-hairline">
				<h2 class="text-lg font-semibold text-ink">Tu pedido</h2>
				{#if order.id}
					<span class="text-xs font-mono text-muted-soft">Nº {order.id.slice(0, 8).toUpperCase()}</span>
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
				<i class="ri-shopping-bag-line"></i>
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
