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
	tutorial_completed?: boolean;
}

export interface PaymentField {
	id: string;
	label: string;
	value: string;
}

export type PaymentProofType = "captura" | "captura_y_tx" | "hash" | "ninguno";
export type PaymentCurrency = "CUP" | "USD" | "ambas";

export interface PaymentMethod {
	id: string;
	title: string;
	currency?: PaymentCurrency;
	fields: PaymentField[];
	instructions?: string | null;
	image?: string | null;
	proof_type?: PaymentProofType;
}

export interface DeliveryZone {
	name: string;
	cup?: number | null;
	usd?: number | null;
	price: number;
}

export type StoreDeliveryMode = "pickup" | "delivery" | "both";

export interface DeliveryConfig {
	zones: DeliveryZone[];
	note?: string | null;
	enabled: boolean;
	mode?: StoreDeliveryMode;
	request_other_zone?: boolean;
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
