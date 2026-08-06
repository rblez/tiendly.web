import { supabase } from '$lib/supabase/server';
import { SITE_URL, storeUrl } from '$lib/utils';

export const prerender = false;

export const GET = async () => {
	const { data: stores } = await supabase
		.from('stores')
		.select('slug')
		.eq('active', true)
		.not('owner_id', 'is', null);

	const staticUrls = ['', '/wizard', '/pricing', '/precios', '/login', '/signup'];
	const urls = [
		...staticUrls.map((path) => `<url><loc>${SITE_URL}${path}</loc><changefreq>monthly</changefreq></url>`),
		...(stores ?? []).map(
			(s) => `<url><loc>${storeUrl(s.slug)}</loc><changefreq>weekly</changefreq></url>`,
		),
	];

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } },
	);
};
