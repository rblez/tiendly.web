import { supabase } from '$lib/supabase/server';

export const load = async ({ parent }) => {
	const { store } = await parent();
	if (!store) return { products: [] };

	const { data: products } = await supabase
		.from('products')
		.select('*')
		.eq('store_id', store.id)
		.eq('active', true)
		.order('position', { ascending: true });

	return {
		products: (products ?? []).map((p) => ({
			...p,
			variants: Array.isArray(p.variants) ? p.variants : [],
			images: Array.isArray(p.images) ? p.images : [],
			ask: Array.isArray(p.ask) ? p.ask : [],
		})),
	};
};
