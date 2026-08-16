import { supabase } from '$lib/supabase/server';

export const load = async () => {
	const [storesRes, productsRes, visitsRes] = await Promise.all([
		supabase
			.from('stores')
			.select('id, name, slug, logo, description')
			.eq('active', true)
			.not('owner_id', 'is', null)
			.limit(300),
		supabase.from('products').select('store_id, category').eq('active', true).limit(5000),
		supabase
			.from('store_visits')
			.select('store_id, visits')
			.gte('visit_date', new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10))
			.limit(3000),
	]);

	const visits = new Map<string, number>();
	for (const v of visitsRes.data ?? []) visits.set(v.store_id, (visits.get(v.store_id) ?? 0) + v.visits);

	const categoriesByStore = new Map<string, Set<string>>();
	for (const p of productsRes.data ?? []) {
		const c = (p.category ?? '').trim();
		if (!c) continue;
		if (!categoriesByStore.has(p.store_id)) categoriesByStore.set(p.store_id, new Set());
		categoriesByStore.get(p.store_id)!.add(c);
	}

	const stores = (storesRes.data ?? []).map((s) => ({
		...s,
		categories: [...(categoriesByStore.get(s.id) ?? [])],
	}));

	return { stores, visits: Object.fromEntries(visits) };
};