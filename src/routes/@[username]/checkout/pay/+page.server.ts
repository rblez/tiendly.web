import { supabase } from '$lib/supabase/server';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { data: store } = await supabase
		.from('stores')
		.select('*')
		.eq('slug', params.username)
		.eq('active', true)
		.maybeSingle();

	if (!store) throw error(404, 'Tienda no encontrada');
	if (!store.owner_id) throw error(404, 'Tienda no encontrada');

	return { store };
};