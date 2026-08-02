export type PlanId = 'free' | 'pro';

export interface Plan {
	id: PlanId;
	name: string;
	price: number;
	priceLabel: string;
	tagline: string;
	features: string[];
	limitStores: number | null;
}

export const PLANS: Plan[] = [
	{
		id: 'free',
		name: 'Free',
		price: 0,
		priceLabel: 'Gratis',
		tagline: 'Para empezar tu primera tienda',
		features: ['1 tienda', 'Hasta 10 productos', 'Catálogo público', 'Pedidos por WhatsApp', 'Marca Tiendly'],
		limitStores: 1,
	},
	{
		id: 'pro',
		name: 'Pro',
		price: 10,
		priceLabel: '10 USDT/mes',
		tagline: 'Para vender sin límites',
		features: ['Tiendas ilimitadas', 'Productos ilimitados', 'Tu propio logo en el catálogo', 'Estadísticas de visitas', 'Soporte prioritario'],
		limitStores: null,
	},
];

export const PLAN_MAP: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;
