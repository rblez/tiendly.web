export type PlanId = 'free' | 'creator' | 'business';

export interface Plan {
	id: PlanId;
	name: string;
	price: number;
	priceLabel: string;
	tagline: string;
	features: string[];
	limitStores: number;
	limitProducts: number;
	customPrice: boolean;
	ctaLabel: string;
	ctaHref: string;
}

export const QUARTER_DISCOUNT = 0.13;

export function planQuarterPrice(price: number): number {
	return Math.round(price * 3 * (1 - QUARTER_DISCOUNT) * 100) / 100;
}

export function planWhatsAppUrl(planName: string, billing: 'monthly' | 'quarterly', email: string): string {
	const modalidad = billing === 'quarterly' ? '3 meses' : '1 mes';
	const correo = email || '—';
	const text = `Hola, quiero adquirir el plan ${planName} (${modalidad}) para mi tienda Tiendly. Mi correo es ${correo}.`;
	return `https://wa.me/5363807214?text=${encodeURIComponent(text)}`;
}

export const PLANS: Plan[] = [
	{
		id: 'free',
		name: 'Gratis',
		price: 0,
		priceLabel: '∞',
		tagline: 'Para empezar a vender hoy',
		features: [
			'1 tienda',
			'Hasta 10 productos',
			'Catálogo público',
			'Pedidos por WhatsApp',
			'Marca Tiendly',
		],
		limitStores: 1,
		limitProducts: 10,
		customPrice: false,
		ctaLabel: 'Empezar gratis',
		ctaHref: '/wizard',
	},
	{
		id: 'creator',
		name: 'Estándar',
		price: 5.99,
		priceLabel: '$5.99 USD/1 mes',
		tagline: 'Para vender en serio',
		features: [
			'Hasta 3 tiendas',
			'Hasta 50 productos por tienda',
			'Personalización avanzada',
			'Estadísticas de visitas',
			'Soporte prioritario',
		],
		limitStores: 3,
		limitProducts: 50,
		customPrice: false,
		ctaLabel: 'Adquirir',
		ctaHref: 'https://wa.me/5363807214',
	},
	{
		id: 'business',
		name: 'Negocios',
		price: 0,
		priceLabel: 'Precio personalizado/1 mes',
		tagline: 'Sin frenos para un negocio grande',
		features: [
			'Productos ilimitados',
			'Tiendas ilimitadas',
			'La mejor experiencia',
			'Atención personalizada',
			'Acceso anticipado a novedades',
		],
		limitStores: Infinity,
		limitProducts: Infinity,
		customPrice: true,
		ctaLabel: 'Adquirir',
		ctaHref: 'https://wa.me/5363807214',
	},
];

export const PLAN_MAP: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

const PLAN_ALIASES: Record<string, PlanId> = {
	free: 'free',
	gratis: 'free',
	creator: 'creator',
	pro: 'creator',
	estandar: 'creator',
	estándar: 'creator',
	business: 'business',
	negocio: 'business',
	negocios: 'business',
	premium: 'business',
};

export function planFromProfile(raw: string | null | undefined): PlanId {
	return PLAN_ALIASES[String(raw ?? '').toLowerCase()] ?? 'free';
}