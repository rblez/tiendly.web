export interface Variant {
	id: string;
	label: string;
	price: number;
	agotado?: boolean;
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
	agotado: boolean;
	active: boolean;
	position: number;
}

export interface OrderItem {
	productId: string;
	variantId?: string;
	quantity: number;
	productName: string;
	label?: string | null;
	price: number;
	currency: string;
}

export interface Order {
	id: string;
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
	yt?: string | null;
	tg?: string | null;
}

export interface Store {
	id: string;
	owner_id: string;
	name: string;
	slug: string;
	logo: string | null;
	banner: string | null;
	whatsapp: string | null;
	theme_color: string;
	description: string | null;
	active: boolean;
	created_at: string;
	visits?: number;
	social?: StoreSocial;
}

export interface CartLine {
	storeSlug: string;
	productId: string;
	variantId?: string;
	quantity: number;
}
