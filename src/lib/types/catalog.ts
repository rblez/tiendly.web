export interface VariantOption {
	id: string;
	label: string;
	price: number;
	agotado?: boolean;
	stock?: number | null;
}

export interface Variant {
	id: string;
	label: string;
	price: number;
	agotado?: boolean;
	stock?: number | null;
	options?: VariantOption[];
}

export type ProductDeliveryType = "none" | "pickup" | "delivery" | "both";

export interface Product {
	id: string;
	store_id: string;
	name: string;
	description: string | null;
	image: string | null;
	images: string[];
	price: number;
	currency: string;
	category: string;
	variants: Variant[];
	ask: string[];
	agotado: boolean;
	bajo_pedido: boolean;
	delivery_type?: string;
	active: boolean;
	stock?: number | null;
	discount_type?: string | null;
	discount_value?: number | null;
	position: number;
	created_at: string;
}
