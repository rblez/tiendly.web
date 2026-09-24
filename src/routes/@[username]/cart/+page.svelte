<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice, imageSrcset, productImage, productStock, variantPrice } from '$lib/utils';
	import { displayCurrency, displayPrice } from '$lib/stores/currency.svelte';
	import { couponStore } from '$lib/stores/coupon.svelte';
	import { couponDiscount, couponLabelText, normalizeCouponCode } from '$lib/coupons';
	import type { Product, Store, Variant } from '$lib/types';

	let { data }: { data: { store: Store } } = $props();

	let products = $state<Record<string, Product>>({});
	let loaded = $state(false);

	let couponInput = $state('');
	let couponError = $state('');
	let couponApplying = $state(false);

	$effect(() => {
		couponStore.sync(data.store.slug);
	});

	$effect(() => {
		const slug = data.store.slug;
		products = {};
		loaded = false;
		let cancelled = false;
		(async () => {
			const { supabase } = await import('$lib/supabase/client');
			const items = cart.items.filter((i) => i.storeSlug === slug);
			if (items.length === 0) {
				if (!cancelled) loaded = true;
				return;
			}
			const ids = items.map((i) => i.productId);
			try {
				const { data: rows, error } = await supabase.from('products').select('*').in('id', ids);
				if (error) throw error;
				if (cancelled) return;
				for (const row of rows ?? []) {
					products[row.id] = {
						...row,
						product_type: row.product_type === 'digital' ? 'digital' : 'physical',
						variants: (Array.isArray(row.variants) ? row.variants : []) as unknown as Variant[],
						images: (Array.isArray(row.images) ? row.images : []) as unknown as string[],
						ask: (Array.isArray(row.ask) ? row.ask : []) as string[],
					};
				}
			} catch (e) {
				console.error('cart load:', e);
			} finally {
				if (!cancelled) loaded = true;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	let appliedCoupon = $derived(couponStore.state.coupon);

	async function handleApplyCoupon() {
		const code = normalizeCouponCode(couponInput);
		if (!code) {
			couponError = 'Escribe el código del cupón.';
			return;
		}
		if (couponApplying) return;
		couponApplying = true;
		couponError = '';
		try {
			const { supabase } = await import('$lib/supabase/client');
			const { data: res, error: rpcError } = await supabase.rpc('validate_coupon', {
				p_store_slug: data.store.slug,
				p_code: code,
			});
			const r = (res ?? {}) as { ok?: boolean; error?: string; code?: string; type?: string; value?: number };
			if (rpcError || !r.ok) {
				couponError = `Este cupón no es válido o ya no está disponible.${r?.error ? ` (${r.error})` : ''}`;
				return;
			}
			couponStore.setCoupon(data.store.slug, { code: r.code ?? code, type: (r.type as 'percent' | 'amount') ?? 'percent', value: r.value ?? 0 });
			couponInput = '';
		} catch {
			couponError = 'No se pudo validar el cupón. Inténtalo de nuevo.';
		} finally {
			couponApplying = false;
		}
	}

	function handleRemoveCoupon() {
		couponStore.clearCoupon(data.store.slug);
		couponError = '';
	}

	let cartLines = $derived(
		cart.items
			.filter((i) => i.storeSlug === data.store.slug)
			.map((ci) => {
				const product = products[ci.productId];
				if (!product) return null;
				const variant = ci.variantId
					? product.variants.find((v) => v.id === ci.variantId)
					: null;
				const option = ci.optionId && variant
					? (variant.options ?? []).find((o) => o.id === ci.optionId) ?? null
					: null;
				const price = variantPrice(variant, ci.optionId, product.price);
				const stock = productStock(product, variant?.id ?? null, option?.id ?? null);
				return { ...ci, product, variant, option, price, stock, label: variant ? (option && variant.options?.length ? variant.label + ' — ' + option.label : variant.label) : null };
			})
			.filter((x): x is NonNullable<typeof x> => x !== null)
	);

	let total = $derived(cartLines.reduce((sum, cp) => sum + displayPrice(cp.price, data.store) * cp.quantity, 0));
	let discount = $derived(couponDiscount(appliedCoupon, total));
	let grandTotal = $derived(Math.max(0, total - discount));
	let cartEmpty = $derived(cart.items.filter((i) => i.storeSlug === data.store.slug).length === 0);
	let itemCount = $derived(cartLines.reduce((sum, cp) => sum + cp.quantity, 0));
	let currency = $derived(displayCurrency(data.store));
</script>

<svelte:head>
	<title>Tu carrito | {data.store.name}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
	{#if !loaded}
		<div class="flex items-center justify-center py-section">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else if cartEmpty}
		<div class="empty-state">
			<div class="mx-auto w-20 h-20 rounded-full bg-bone flex items-center justify-center mb-5">
				<i class="ri-shopping-bag-line text-3xl text-muted-soft"></i>
			</div>
			<h1 class="text-2xl font-black text-ink mb-1.5">Tu carrito está vacío</h1>
			<p class="text-sm text-muted mb-7">Explora el catálogo y añade algo que te guste.</p>
			<a
				href={`/@${data.store.slug}`}
				class="btn btn-3d btn-md w-full no-underline"
			>
				Ver productos
				<i class="ri-arrow-right-line"></i>
			</a>
		</div>
	{:else}
		<div class="flex items-end justify-between gap-4 mb-7">
			<div>
				<h1 class="text-2xl sm:text-3xl font-black text-ink">Tu carrito</h1>
				<p class="text-sm text-muted mt-1">
					{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
				</p>
			</div>
			<a
				href={`/@${data.store.slug}`}
				class="inline-flex items-center gap-1.5 text-sm text-body hover:text-ember transition-colors no-underline whitespace-nowrap"
			>
				<i class="ri-arrow-left-line"></i>
				Seguir comprando
			</a>
		</div>

		<ul class="space-y-3 mb-6">
			{#each cartLines as cp}
				<li class="flex gap-4 bg-card border border-hairline rounded-card p-4 sm:p-5">
					{#if productImage(cp.product)}
						<img
							src={productImage(cp.product)!}
							srcset={imageSrcset(productImage(cp.product)) ?? undefined}
							sizes="96px"
							alt={cp.product.name}
							width="96"
							height="96"
							class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-btn bg-canvas flex-shrink-0"
							loading="lazy"
							decoding="async"
						/>
					{:else}
						<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-btn bg-canvas flex items-center justify-center flex-shrink-0">
							<i class="ri-image-line text-2xl text-muted-soft"></i>
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="flex items-start justify-between gap-2">
							<h3 class="font-semibold text-ink leading-snug">
								<a href={`/@${data.store.slug}/p/${cp.product.id}`} class="hover:text-ember transition-colors no-underline">
									{cp.product.name}
								</a>
							</h3>
							<button
								onclick={() => cart.removeItem(cp.productId, cp.variantId, cp.optionId)}
								class="p-1.5 text-muted-soft hover:text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer flex-shrink-0"
								aria-label="Eliminar"
							>
								<i class="ri-delete-bin-line text-lg"></i>
							</button>
						</div>
						{#if cp.label}
							<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-bone text-muted text-[11px] font-medium mt-1.5">
								{cp.label}
							</span>
						{/if}
						<div class="mt-3 flex items-center justify-between gap-3">
							<div class="inline-flex items-center border border-hairline rounded-full px-1 py-1">
								<button
									onclick={() => cart.updateQuantity(cp.productId, cp.quantity - 1, cp.variantId, cp.optionId)}
									class="w-8 h-8 flex items-center justify-center rounded-full text-ink hover:bg-bone transition-colors cursor-pointer"
									aria-label="Restar"
								>
									<i class="ri-subtract-line"></i>
								</button>
								<span class="w-8 text-center font-semibold text-ink tabular-nums">{cp.quantity}</span>
								<button
									onclick={() => cart.updateQuantity(cp.productId, cp.quantity + 1, cp.variantId, cp.optionId, cp.stock)}
									disabled={cp.stock != null && cp.quantity >= cp.stock}
									class="w-8 h-8 flex items-center justify-center rounded-full text-ink hover:bg-bone transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
									aria-label="Sumar"
								>
									<i class="ri-add-line"></i>
								</button>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-ink tabular-nums">{formatPrice(displayPrice(cp.price, data.store) * cp.quantity, currency)}</p>
								{#if cp.quantity > 1}
									<p class="text-[11px] text-muted-soft tabular-nums">{formatPrice(displayPrice(cp.price, data.store), currency)} c/u</p>
								{/if}
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>

		<div class="bg-card border border-hairline rounded-card p-5 sm:p-6">
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted">Subtotal</span>
				<span class="font-medium text-ink tabular-nums">{formatPrice(total, currency)}</span>
			</div>
			<div class="flex items-center justify-between text-sm mt-2">
				<span class="text-muted">Envío</span>
				<span class="text-body">A acordar por WhatsApp</span>
			</div>

			{#if appliedCoupon}
				<div class="flex items-center justify-between text-sm mt-3 border-t border-hairline pt-3">
					<span class="inline-flex items-center gap-1.5 text-success">
						<i class="ri-coupon-line"></i>
						Cupón <span class="font-mono font-semibold">{appliedCoupon.code}</span>
						<span class="text-xs text-muted-soft">(-{couponLabelText(appliedCoupon)})</span>
					</span>
					<div class="flex items-center gap-3">
						<span class="font-medium text-success tabular-nums">-{formatPrice(discount, currency)}</span>
						<button
							onclick={handleRemoveCoupon}
							class="text-muted-soft hover:text-error transition-colors cursor-pointer"
							aria-label="Quitar cupón"
						>
							<i class="ri-close-circle-line text-lg"></i>
						</button>
					</div>
				</div>
			{:else}
				<div class="mt-3">
					<p class="text-xs font-medium text-body mb-1.5">¿Tienes un cupón?</p>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={couponInput}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleApplyCoupon();
								}
							}}
							placeholder="Ej: VERANO10"
							class="input flex-1 min-w-0 uppercase placeholder:normal-case"
						/>
						<button
							onclick={handleApplyCoupon}
							disabled={couponApplying}
							class="btn btn-secondary btn-sm disabled:opacity-50"
						>
							{#if couponApplying}
								<i class="ri-loader-4-line animate-spin"></i>
							{:else}
								Aplicar
							{/if}
						</button>
					</div>
					{#if couponError}
						<p class="text-xs text-error mt-1.5">{couponError}</p>
					{/if}
				</div>
			{/if}

			{#if discount > 0}
				<div class="flex items-center justify-between text-sm mt-2">
					<span class="text-success">Descuento</span>
					<span class="font-medium text-success tabular-nums">-{formatPrice(discount, currency)}</span>
				</div>
			{/if}
			<div class="border-t border-hairline mt-4 pt-4 flex items-center justify-between">
				<span class="text-lg font-bold text-ink">Total</span>
				<span class="text-xl font-black text-ember tabular-nums">{formatPrice(grandTotal, currency)}</span>
			</div>

			<a
				href={`/@${data.store.slug}/checkout`}
				class="mt-6 btn btn-3d btn-lg w-full no-underline"
			>
				Continuar al checkout
				<i class="ri-arrow-right-line"></i>
			</a>
			<a
				href={`/@${data.store.slug}`}
				class="mt-3 block text-center text-sm text-body hover:text-ember transition-colors no-underline"
			>
				Seguir comprando
			</a>
		</div>
	{/if}
</section>
