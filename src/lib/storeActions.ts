import type { Product, Store, Variant } from '$lib/types';
import { formatPrice, waLink, variantLabel, variantPrice } from '$lib/utils';

export type StoreAction = 'whatsapp' | 'sin_contactar';

export const STORE_ACTIONS = [
	{
		id: 'whatsapp',
		label: 'Pedir por WhatsApp',
		icon: 'ri-whatsapp-line',
		hint: 'Sin métodos de pago. El cliente te escribe directo por WhatsApp.',
	},
	{
		id: 'sin_contactar',
		label: 'Pedir sin contactar',
		icon: 'ri-shopping-cart-line',
		hint: 'Con métodos de pago. El pedido llega a tu panel y tú contactas al cliente.',
	},
] as const;

export function storeAction(store: Pick<Store, 'action' | 'whatsapp'> | null | undefined): StoreAction {
	if (store?.action === 'whatsapp' && store.whatsapp) return 'whatsapp';
	return 'sin_contactar';
}

export function isCatalogMode(store: Pick<Store, 'action' | 'whatsapp'> | null | undefined): boolean {
	return storeAction(store) === 'whatsapp';
}

export function productOrderMessage(
	store: Pick<Store, 'name'>,
	product: Pick<Product, 'name' | 'price' | 'currency'>,
	variant?: Variant | null,
	optionId?: string | null,
): string {
	const label = variantLabel(variant ?? null, optionId);
	const labelPart = label ? ` (${label})` : '';
	const price = formatPrice(variant ? variantPrice(variant, optionId) : product.price, product.currency);
	return `Hola ${store.name} 👋\nQuiero pedir: ${product.name}${labelPart} — ${price}`;
}

export function actionLink(
	action: StoreAction,
	store: Pick<Store, 'whatsapp'>,
	message: string,
): string | null {
	if (action === 'whatsapp') {
		if (!store.whatsapp) return null;
		return waLink(store.whatsapp, message);
	}
	return null;
}

export function actionConfig(action: StoreAction) {
	return STORE_ACTIONS.find((a) => a.id === action) ?? STORE_ACTIONS[1];
}