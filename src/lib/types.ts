export interface VariantOption {
	id: string;
	label: string;
	price: number;
	agotado?: boolean;
}

export interface Variant {
	id: string;
	label: string;
	price: number;
	agotado?: boolean;
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
	action?: string;
	currency?: string | null;
	exchange_rate?: number | null;
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
