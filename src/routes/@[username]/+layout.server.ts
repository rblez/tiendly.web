import { supabase } from '$lib/supabase/server';
import { error } from '@sveltejs/kit';
import { planFromProfile } from '$lib/plans';

export const load = async ({ params }) => {
	const { data: store } = await supabase
		.from('stores')
		.select('*')
		.eq('slug', params.username)
		.maybeSingle();

	if (!store) throw error(404, 'Tienda no encontrada');

	const { data: owner } = store.owner_id
		? await supabase.from('profiles').select('plan').eq('id', store.owner_id).maybeSingle()
		: { data: null };

	return { store, ownerPlan: planFromProfile(owner?.plan) };
};
