export type PlanId = 'free' | 'pro' | 'premium';

export interface Plan {
	id: PlanId;
	name: string;
	price: number;
	priceLabel: string;
	tagline: string;
	features: string[];
	limitStores: number;
	limitProducts: number;
}

export const PLANS: Plan[] = [
	{
		id: 'free',
		name: 'Free',
		price: 0,
		priceLabel: 'Gratis',
		tagline: 'Para probar tu primera tienda',
		features: ['1 tienda', 'Hasta 10 productos', 'Catálogo público', 'Pedidos por WhatsApp', 'Marca Tiendly'],
		limitStores: 1,
		limitProducts: 10,
	},
	{
		id: 'pro',
		name: 'Pro',
		price: 4.99,
		priceLabel: '$4.99 USD/mes',
		tagline: 'Para vender en serio',
		features: ['Hasta 5 tiendas', 'Hasta 100 productos', 'Estadísticas de visitas', 'Tu propio logo en el catálogo', 'Soporte prioritario'],
		limitStores: 5,
		limitProducts: 100,
	},
	{
		id: 'premium',
		name: 'Premium',
		price: 12.99,
		priceLabel: '$12.99 USD/mes',
		tagline: 'Para crecer sin frenos',
		features: ['Hasta 15 tiendas', 'Hasta 500 productos', 'Todo lo de Pro', 'Sin marca Tiendly en tu tienda', 'Acceso anticipado a novedades'],
		limitStores: 15,
		limitProducts: 500,
	},
];

export const PLAN_MAP: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;
