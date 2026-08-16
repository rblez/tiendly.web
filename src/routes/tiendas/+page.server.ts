import { supabase } from '$lib/supabase/server';

export const load = async () => {
	const [storesRes, visitsRes] = await Promise.all([
		supabase
			.from('stores')
			.select('id, name, slug, logo, description, category')
			.eq('active', true)
			.not('owner_id', 'is', null)
			.limit(300),
		supabase
			.from('store_visits')
			.select('store_id, visits')
			.gte('visit_date', new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10))
			.limit(3000),
	]);

	const visits = new Map<string, number>();
	for (const v of visitsRes.data ?? []) visits.set(v.store_id, (visits.get(v.store_id) ?? 0) + v.visits);

	const stores = (storesRes.data ?? []).map((s) => ({
		...s,
		category: (s.category ?? '').trim() || null,
	}));

	return { stores, visits: Object.fromEntries(visits) };
};