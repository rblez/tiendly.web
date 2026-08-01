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

	function addItem(slug: string, productId: string, variantId?: string) {
		if (items.length > 0 && items[0].storeSlug !== slug) {
			if (
				typeof window !== 'undefined' &&
				!window.confirm('Tu carrito tiene productos de otra tienda. ¿Lo vacías y empiezas aquí?')
			) {
				return;
			}
			items = [];
		}
		const existing = items.find(
			(i) => i.productId === productId && i.variantId === (variantId ?? undefined)
		);
		if (existing) {
			existing.quantity += 1;
		} else {
			items.push({ storeSlug: slug, productId, variantId: variantId ?? undefined, quantity: 1 });
		}
		saveCart(items);
	}

	function removeItem(productId: string, variantId?: string) {
		items = items.filter(
			(i) => !(i.productId === productId && i.variantId === (variantId ?? undefined))
		);
		saveCart(items);
	}

	function updateQuantity(productId: string, quantity: number, variantId?: string) {
		if (quantity <= 0) {
			removeItem(productId, variantId);
			return;
		}
		const item = items.find(
			(i) => i.productId === productId && i.variantId === (variantId ?? undefined)
		);
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
