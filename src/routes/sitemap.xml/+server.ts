import { supabase } from '$lib/supabase/server';
import { SITE_URL, productUrl, storeUrl } from '$lib/utils';

export const prerender = false;

type StoreRow = { slug: string; created_at: string };
type ProductRow = { id: string; created_at: string; stores: { slug: string } | { slug: string }[] | null };

// Fecha de la última actualización de las páginas estáticas (actualizar si cambian).
const STATIC_LASTMOD = '2026-09-26';

const esc = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const urlEntry = (loc: string, changefreq: string, priority: string, lastmod?: string | null): string =>
	`<url><loc>${esc(loc)}</loc>` +
	(lastmod ? `<lastmod>${esc(lastmod.slice(0, 10))}</lastmod>` : '') +
	`<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

export const GET = async () => {
	const [{ data: stores }, { data: products }] = await Promise.all([
		supabase.from('stores').select('slug, created_at').eq('active', true).not('owner_id', 'is', null),
		supabase
			.from('products')
			.select('id, created_at, stores!inner(slug)')
			.eq('active', true)
			.eq('agotado', false)
			.eq('stores.active', true)
			.not('stores.owner_id', 'is', null)
			.limit(5000),
	]);

	const seen = new Set<string>();
	const entries: string[] = [];
	const push = (loc: string, changefreq: string, priority: string, lastmod?: string | null) => {
		if (!loc || seen.has(loc)) return;
		seen.add(loc);
		entries.push(urlEntry(loc, changefreq, priority, lastmod));
	};

	// Nota: /wizard no se incluye a propósito: requiere sesión y está en
	// Disallow en robots.txt (un sitemap no debe listar URLs bloqueadas).
	push(`${SITE_URL}/`, 'monthly', '1.0', STATIC_LASTMOD);
	push(`${SITE_URL}/tiendas`, 'weekly', '0.8', STATIC_LASTMOD);
	push(`${SITE_URL}/precios`, 'monthly', '0.7', STATIC_LASTMOD);
	push(`${SITE_URL}/legal/terminos`, 'monthly', '0.3', STATIC_LASTMOD);
	push(`${SITE_URL}/legal/privacidad`, 'monthly', '0.3', STATIC_LASTMOD);
	push(`${SITE_URL}/legal/cookies`, 'monthly', '0.3', STATIC_LASTMOD);

	for (const s of (stores ?? []) as StoreRow[]) {
		if (!s.slug) continue;
		push(storeUrl(s.slug), 'weekly', '0.8', s.created_at);
	}

	for (const p of (products ?? []) as ProductRow[]) {
		const store = Array.isArray(p.stores) ? p.stores[0] : p.stores;
		if (!store?.slug || !p.id) continue;
		push(productUrl(store.slug, p.id), 'weekly', '0.6', p.created_at);
	}

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } },
	);
};
