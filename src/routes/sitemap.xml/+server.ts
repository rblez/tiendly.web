import { supabase } from '$lib/supabase/server';
import { SITE_URL, storeUrl } from '$lib/utils';

export const prerender = false;

type StoreRow = { slug: string };
type ProductRow = { id: string; stores: StoreRow | StoreRow[] | null };

const url = (loc: string, changefreq: string, priority: string) =>
	`<url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

export const GET = async () => {
	const [{ data: stores }, { data: products }] = await Promise.all([
		supabase.from('stores').select('slug').eq('active', true).not('owner_id', 'is', null),
		supabase
			.from('products')
			.select('id, stores!inner(slug)')
			.eq('active', true)
			.eq('agotado', false)
			.eq('stores.active', true)
			.not('stores.owner_id', 'is', null)
			.limit(5000),
	]);

	const paths: Array<[string, string, string]> = [
		['/', 'monthly', '1.0'],
		['/wizard', 'monthly', '0.9'],
		['/pricing', 'monthly', '0.7'],
		['/precios', 'monthly', '0.7'],
		['/crear', 'monthly', '0.7'],
		['/login', 'monthly', '0.3'],
		['/signup', 'monthly', '0.3'],
	];

	const storeEntries: Array<[string, string, string]> = (stores ?? []).map((s) => [storeUrl(s.slug), 'weekly', '0.8']);

	const productEntries: Array<[string, string, string]> = [];
	for (const p of products ?? []) {
		const store = Array.isArray(p.stores) ? p.stores[0] : p.stores;
		if (!store) continue;
		productEntries.push([`${storeUrl(store.slug)}/p/${p.id}`, 'weekly', '0.6']);
	}

	const urls = [
		...paths.map(([path, cf, priority]) => url(`${SITE_URL}${path}`, cf, priority)),
		...storeEntries.map(([loc, cf, priority]) => url(loc, cf, priority)),
		...productEntries.map(([loc, cf, priority]) => url(loc, cf, priority)),
	];

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } },
	);
};