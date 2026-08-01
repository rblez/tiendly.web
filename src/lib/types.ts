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

export interface Store {
	id: string;
	owner_id: string;
	name: string;
	slug: string;
	logo: string | null;
	whatsapp: string | null;
	theme_color: string;
	description: string | null;
	active: boolean;
	created_at: string;
}

export interface CartLine {
	storeSlug: string;
	productId: string;
	variantId?: string;
	quantity: number;
}
