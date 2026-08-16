export type StoreAction = 'whatsapp' | 'sin_contactar';

export const STORE_ACTIONS = [
	{
		id: 'whatsapp',
		label: 'Pedir por WhatsApp',
		icon: 'ri-whatsapp-line',
		hint: 'Checkout sin métodos de pago. El pedido te llega por WhatsApp.',
	},
	{
		id: 'sin_contactar',
		label: 'Pedir sin contactar',
		icon: 'ri-shopping-cart-line',
		hint: 'Checkout con métodos de pago y comprobante. El pedido llega a tu panel.',
	},
] as const;