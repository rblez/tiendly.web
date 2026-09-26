import { SITE_URL } from '$lib/utils';

export const prerender = true;

export const GET = () =>
	new Response(
		`User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/\nDisallow: /login\nDisallow: /signup\nDisallow: /forgot-password\nDisallow: /auth/\nDisallow: /checkout\nDisallow: /wizard\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
		{ headers: { 'Content-Type': 'text/plain' } },
	);
