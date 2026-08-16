<script lang="ts">
	import { formatPrice } from '$lib/utils';
	import { supabase } from '$lib/supabase/client';
	import type { Order, Store } from '$lib/types';

	let { store, initialCode, onClose }: { store: Store; initialCode: string; onClose: () => void } = $props();

	type TrackOrder = Pick<Order, 'code' | 'status' | 'created_at' | 'items' | 'total' | 'currency' | 'notes' | 'payment' | 'payment_receipt' | 'delivery'>;

	const STATUS_INFO: Record<string, { label: string; cls: string; desc: string }> = {
		nuevo: { label: 'Nuevo', cls: 'bg-ember/15 text-ember', desc: 'Recibimos tu pedido y ya está en proceso de confirmación.' },
		enviado: { label: 'Enviado', cls: 'bg-bone text-body', desc: 'Tu pedido salió en camino. Verifica con la tienda el tiempo de entrega.' },
		completado: { label: 'Completado', cls: 'bg-success/15 text-success', desc: 'Tu pedido fue entregado. ¡Gracias por comprar!' },
		cancelado: { label: 'Cancelado', cls: 'bg-error/15 text-error', desc: 'Este pedido fue cancelado.' },
	};

	// svelte-ignore state_referenced_locally
	let code = $state((initialCode ?? '').trim().toLowerCase());
	let searching = $state(false);
	let error = $state('');
	let order = $state<TrackOrder | null>(null);
	let loaded = $state(false);

	const status = $derived(order ? (STATUS_INFO[order.status] ?? STATUS_INFO.nuevo) : null);

	const BANK_LABELS: Record<string, string> = {
		bpa: 'Banco Popular de Ahorro',
		bandec: 'Banco de Crédito y Comercio',
		metropolitano: 'Banco Metropolitano',
		monedero: 'Monedero MiTransfer',
	};
	function bankLabel(id: unknown): string {
		return typeof id === 'string' ? (BANK_LABELS[id] ?? id) : '';
	}

	async function findOrder(fromInput = false) {
		const c = (code.trim().toLowerCase() || (initialCode ?? '').trim().toLowerCase());
		if (!c) {
			if (fromInput) error = 'Escribe el número de tu pedido.';
			return;
		}
		code = c;
		searching = true;
		error = '';
		const { data: result, error: rpcError } = await supabase.rpc('track_order', {
			p_slug: store.slug,
			p_code: c,
		});
		searching = false;
		order = null;
		loaded = true;
		if (rpcError || !result) {
			error = 'No encontramos ningún pedido con ese número en esta tienda.';
			return;
		}
		order = result as unknown as TrackOrder;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		findOrder(true);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') onClose();
	}}
/>

<div
	class="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
	aria-label="Rastrear pedido"
	tabindex="-1"
	onkeydown={(e) => {
		if (e.key === 'Escape') onClose();
	}}
	onclick={(e) => {
		if (e.target === e.currentTarget) onClose();
	}}
>
	<div class="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-hairline rounded-card p-5 sm:p-7">
		<div class="flex items-start justify-between gap-3 mb-4">
			<div>
				<h2 class="text-xl font-bold text-ink">Rastrear pedido</h2>
				<p class="text-sm text-muted-soft mt-0.5">Escribe el número de tu pedido para ver su estado.</p>
			</div>
			<button
				onclick={onClose}
				class="w-8 h-8 flex items-center justify-center flex-shrink-0 text-muted hover:text-ink hover:bg-bone rounded-btn transition-colors cursor-pointer"
				aria-label="Cerrar"
			>
				<i class="ri-close-line"></i>
			</button>
		</div>

		<form onsubmit={handleSubmit} class="flex gap-2 mb-5">
			<input
				type="text"
				bind:value={code}
				placeholder="Nº de pedido"
				aria-label="Número de pedido"
				class="flex-1 min-w-0 px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
			/>
			<button type="submit" disabled={searching} class="btn-3d px-4 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60">
				{searching ? 'Buscando...' : 'Buscar'}
			</button>
		</form>

		{#if error}
			<div class="bg-error/10 border border-error/30 text-error rounded-btn px-4 py-3 text-sm">{error}</div>
		{:else if order}
			<div>
				<div class="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-hairline flex-wrap">
					<div>
						<p class="text-xs text-muted-soft">Nº de pedido</p>
						<p class="font-mono font-bold text-ink text-lg">{order.code ?? ''}</p>
					</div>
					{#if status}
						<span class={`text-xs font-medium px-3 py-1.5 rounded-full ${status.cls}`}>{status.label}</span>
					{/if}
				</div>

				<p class="text-xs text-muted-soft mb-4">
					Pedido del {new Date(order.created_at).toLocaleDateString('es-CU', { day: 'numeric', month: 'long', year: 'numeric' })}
				</p>

				{#if status}
					<div class="bg-bone border border-hairline rounded-btn px-4 py-3 mb-5">
						<p class="text-sm text-body leading-relaxed">{status.desc}</p>
					</div>
				{/if}

				<div class="bg-canvas rounded-btn px-4 py-3 mb-4 divide-y divide-hairline-soft">
					{#each order.items as item}
						<div class="py-1.5 first:pt-0 last:pb-0 text-sm">
							<div class="flex items-center justify-between gap-3">
								<span class="text-body min-w-0 flex items-center gap-2">
									<span class="text-[10px] font-bold text-ember bg-ember/10 rounded px-1.5 py-0.5 flex-shrink-0">x{item.quantity}</span>
									<span class="truncate">
										{item.productName}
										{#if item.label}
											<span class="text-ember"> — {item.label}</span>
										{/if}
									</span>
								</span>
								<span class="text-ink font-medium flex-shrink-0 tabular-nums">{formatPrice(item.price * item.quantity, item.currency)}</span>
							</div>
						</div>
					{/each}
					{#if order.delivery}
						<div class="py-1.5 text-sm flex items-center justify-between gap-3">
							<span class="text-body">Mensajería — {order.delivery.name}</span>
							<span class="text-ink font-medium tabular-nums">{formatPrice(order.delivery.price, order.currency)}</span>
						</div>
					{/if}
					<div class="py-1.5 text-sm flex items-center justify-between gap-3">
						<span class="font-bold text-ink">Total</span>
						<span class="font-bold text-ember tabular-nums">{formatPrice(order.total, order.currency)}</span>
					</div>
				</div>

				{#if order.payment}
					<div class="bg-bone border border-hairline rounded-btn px-4 py-3">
						<p class="text-xs font-medium text-body mb-1">Método de pago</p>
						<p class="text-sm font-semibold text-ink">
							{bankLabel(order.payment.bank)}
							<span class="text-muted font-normal"> · {order.payment.account}</span>
						</p>
					</div>
				{/if}
			</div>
		{:else if loaded}
			<div class="text-center py-12 bg-bone border border-hairline rounded-btn">
				<p class="text-base text-muted mb-1">No se encontró el pedido</p>
				<p class="text-sm text-muted-soft">Revisa que el número sea correcto.</p>
			</div>
		{/if}
	</div>
</div>