export type PlanId = 'free';

export interface Plan {
	id: PlanId;
	name: string;
	priceLabel: string;
	tagline: string;
	features: string[];
	limitStores: number;
	limitProducts: number;
	ctaLabel: string;
	ctaHref: string;
}

export const PLANS: Plan[] = [
	{
		id: 'free',
		name: 'Gratis',
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
		ctaLabel: 'Empezar gratis',
		ctaHref: '/wizard',
	},
];

export const PLAN_MAP: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

export function planFromProfile(_raw: string | null | undefined): PlanId {
	return 'free';
}