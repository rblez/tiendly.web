import type { CartLine } from '$lib/types';

const STORAGE_KEY = 'tiendly-cart';

function loadCart(): CartLine[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveCart(items: CartLine[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createCartStore() {
	let items = $state<CartLine[]>([]);

	function init() {
		items = loadCart();
	}

	let storeSlug = $derived(items[0]?.storeSlug ?? '');

	function sameLine(a: CartLine, b: Pick<CartLine, 'productId' | 'variantId' | 'optionId'>) {
		return (
			a.productId === b.productId &&
			a.variantId === (b.variantId ?? undefined) &&
			a.optionId === (b.optionId ?? undefined)
		);
	}

	function addItem(slug: string, productId: string, variantId?: string, optionId?: string) {
		if (items.length > 0 && items[0].storeSlug !== slug) {
			if (
				typeof window !== 'undefined' &&
				!window.confirm('Tu carrito tiene productos de otra tienda. ¿Lo vacías y empiezas aquí?')
			) {
				return;
			}
			items = [];
		}
		const existing = items.find((i) => sameLine(i, { productId, variantId, optionId }));
		if (existing) {
			existing.quantity += 1;
		} else {
			items.push({
				storeSlug: slug,
				productId,
				variantId: variantId ?? undefined,
				optionId: optionId ?? undefined,
				quantity: 1,
			});
		}
		saveCart(items);
	}

	function removeItem(productId: string, variantId?: string, optionId?: string) {
		items = items.filter((i) => !sameLine(i, { productId, variantId, optionId }));
		saveCart(items);
	}

	function updateQuantity(productId: string, quantity: number, variantId?: string, optionId?: string) {
		if (quantity <= 0) {
			removeItem(productId, variantId, optionId);
			return;
		}
		const item = items.find((i) => sameLine(i, { productId, variantId, optionId }));
		if (item) {
			item.quantity = quantity;
			saveCart(items);
		}
	}

	function clear() {
		items = [];
		saveCart(items);
	}

	function totalItems() {
		return items.reduce((sum, i) => sum + i.quantity, 0);
	}

	init();

	return {
		get items() { return items; },
		get storeSlug() { return storeSlug; },
		addItem,
		removeItem,
		updateQuantity,
		clear,
		totalItems,
	};
}

export const cart = createCartStore();
