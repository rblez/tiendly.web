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
	active: boolean;
	stock?: number | null;
	position: number;
	created_at: string;
}

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
	status: string;
	payment?: PaymentMethod | null;
	payment_receipt?: string | null;
	delivery?: DeliveryZone | null;
	created_at: string;
}

export interface StoreSocial {
	fb?: string | null;
	ig?: string | null;
	x?: string | null;
	yt?: string | null;
	tg?: string | null;
}

export interface Profile {
	id: string;
	name: string;
	phone: string | null;
	avatar_url: string | null;
	plan: string;
	created_at: string;
}

export type BankId = "bpa" | "bandec" | "metropolitano" | "monedero";

export interface PaymentMethod {
	id: string;
	bank: BankId;
	account: string;
	phone: string;
	name?: string | null;
}

export interface DeliveryZone {
	name: string;
	price: number;
}

export interface DeliveryConfig {
	zones: DeliveryZone[];
	note?: string | null;
	enabled: boolean;
}

export interface Store {
	id: string;
	code: string;
	owner_id: string;
	name: string;
	slug: string;
	logo: string | null;
	banner: string | null;
	whatsapp: string | null;
	theme_color: string;
	description: string | null;
	extra_links?: { title: string; url: string }[];
	location?: string | null;
	schedule?: string | null;
	active: boolean;
	category?: string | null;
	action?: string;
	currency?: string | null;
	exchange_rate?: number | null;
	exchange_rates?: Record<string, number> | null;
	payments?: PaymentMethod[] | null;
	delivery?: DeliveryConfig | null;
	created_at: string;
	visits?: number;
	social?: StoreSocial;
}

export interface CartLine {
	storeSlug: string;
	productId: string;
	variantId?: string;
	optionId?: string;
	quantity: number;
}
