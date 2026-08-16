import type { Product, Store, Variant } from '$lib/types';
import type { StoreSocial } from '$lib/types';
import { formatPrice, waLink, variantLabel, variantPrice } from '$lib/utils';
import { storeSocials } from '$lib/socials';

export type StoreAction = 'comprar' | 'whatsapp' | 'telegram' | 'contactar';

export const STORE_ACTIONS = [
	{ id: 'comprar', label: 'Comprar (carrito y checkout)', icon: 'ri-shopping-cart-line' },
	{ id: 'whatsapp', label: 'Pedir por WhatsApp', icon: 'ri-whatsapp-line' },
	{ id: 'telegram', label: 'Contactar por Telegram', icon: 'ri-telegram-line' },
	{ id: 'contactar', label: 'Contactar por WhatsApp', icon: 'ri-chat-smile-line' },
] as const;

export function storeAction(store: Pick<Store, 'action' | 'whatsapp' | 'social'> | null | undefined): StoreAction {
	const a = store?.action;
	if (a === 'whatsapp' || a === 'telegram' || a === 'contactar') {
		if (a === 'telegram' && !telegramHandle(store ?? null)) return 'whatsapp';
		if ((a === 'whatsapp' || a === 'contactar') && !store?.whatsapp) {
			return telegramHandle(store ?? null) ? 'telegram' : 'comprar';
		}
		return a;
	}
	return 'comprar';
}

export function telegramHandle(store: { social?: StoreSocial | null } | null): string {
	const tg = storeSocials(store).find((s) => s.key === 'tg');
	if (!tg) return '';
	return tg.url.replace(/^https?:\/\//i, '').replace(/^t\.me\//i, '');
}

export function isCatalogMode(store: Pick<Store, 'action' | 'whatsapp' | 'social'> | null | undefined): boolean {
	return storeAction(store) !== 'comprar';
}

export function productOrderMessage(
	store: Pick<Store, 'name'>,
	product: Pick<Product, 'name' | 'price' | 'currency'>,
	variant?: Variant | null,
	optionId?: string | null,
): string {
	const label = variantLabel(variant ?? null, optionId);
	const labelPart = label ? ` (${label})` : '';
	const price = formatPrice(variantPrice(variant, optionId), product.currency);
	return `Hola ${store.name} 👋\nQuiero pedir: ${product.name}${labelPart} — ${price}`;
}

export function actionLink(
	action: StoreAction,
	store: Pick<Store, 'name' | 'whatsapp' | 'social'>,
	message: string,
): string | null {
	if (action === 'whatsapp' || action === 'contactar') {
		if (!store.whatsapp) return null;
		return waLink(store.whatsapp, message);
	}
	if (action === 'telegram') {
		const handle = telegramHandle(store);
		if (!handle) return null;
		return `https://t.me/${handle}`;
	}
	return null;
}

export function actionConfig(action: StoreAction) {
	return STORE_ACTIONS.find((a) => a.id === action) ?? STORE_ACTIONS[0];
}