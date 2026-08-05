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
}

export const PLANS: Plan[] = [
	{
		id: 'free',
		name: 'Free',
		price: 0,
		priceLabel: 'Gratis',
		tagline: 'Para probar tu primera tienda',
		features: ['1 tienda', 'Hasta 20 productos', 'Catálogo público', 'Pedidos por WhatsApp', 'Marca Tiendly'],
		limitStores: 1,
		limitProducts: 20,
	},
	{
		id: 'creator',
		name: 'Creator',
		price: 4.99,
		priceLabel: '$4.99 USD/mes',
		tagline: 'Para vender en serio',
		features: ['Hasta 5 tiendas', 'Hasta 100 productos por tienda', 'Personalización avanzada', 'Estadísticas de visitas', 'Soporte prioritario'],
		limitStores: 5,
		limitProducts: 100,
	},
	{
		id: 'business',
		name: 'Business',
		price: 12.99,
		priceLabel: '$12.99 USD/mes',
		tagline: 'Para crecer sin frenos',
		features: ['Hasta 5 tiendas', 'Productos ilimitados', 'Todo lo de Creator', 'Sin marca Tiendly en tu tienda', 'Acceso anticipado a novedades'],
		limitStores: 5,
		limitProducts: Infinity,
	},
];

export const PLAN_MAP: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;
