import { SITE_URL } from '$lib/utils';

export const prerender = true;

export const GET = () =>
	new Response(
		`User-agent: *\nAllow: /\nDisallow: /dash\nDisallow: /app\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
		{ headers: { 'Content-Type': 'text/plain' } },
	);