import type { DeliveryZone, PaymentMethod } from "./store";

export interface OrderItem {
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

export interface Order {
	id: string;
	code: string | null;
	store_id: string;
	customer_name: string;
	customer_phone: string;
	notes: string | null;
	items: OrderItem[];
	total: number;
	currency: string;
	coupon_code?: string | null;
	discount?: number;
	status: string;
	payment?: PaymentMethod | null;
	payment_receipt?: string | null;
	delivery?: DeliveryZone | null;
	created_at: string;
}

export interface Coupon {
	id: string;
	store_id: string;
	code: string;
	type: "percent" | "amount";
	value: number;
	max_uses: number | null;
	uses: number;
	expires_at: string | null;
	active: boolean;
	created_at: string;
}

export interface CartLine {
	storeSlug: string;
	productId: string;
	variantId?: string;
	optionId?: string;
	quantity: number;
}
