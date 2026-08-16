import { supabase } from '$lib/supabase/server';
import { error } from '@sveltejs/kit';

export const load = async ({ params, parent }) => {
	const { store } = await parent();

	const { data: product } = await supabase
		.from('products')
		.select('*')
		.eq('id', params.id)
		.eq('store_id', store.id)
		.eq('active', true)
		.maybeSingle();

	if (!product) throw error(404, 'Producto no encontrado');

	return {
		product: {
			...product,
			variants: Array.isArray(product.variants) ? product.variants : [],
			images: Array.isArray(product.images) ? product.images : [],
			ask: Array.isArray(product.ask) ? product.ask : [],
		},
	};
};
