import { supabase } from '$lib/supabase/server';

export const prerender = false;

export const GET = async () => {
	const { data: stores } = await supabase.from('stores').select('slug').eq('active', true);

	const staticUrls = ['/', '/wizard', '/pricing', '/login', '/signup'];
	const urls = [
		...staticUrls.map((path) => `<url><loc>https://www.tiendly.lat${path}</loc><changefreq>monthly</changefreq></url>`),
		...(stores ?? []).map(
			(s) => `<url><loc>https://www.tiendly.lat/@${s.slug}</loc><changefreq>weekly</changefreq></url>`,
		),
	];

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } },
	);
};
