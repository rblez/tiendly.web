import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { SITE_URL, storeSlugFromHost } from '$lib/utils';

const STATIC_PATH = /^\/(?:_app\/|favicon|robots\.txt|manifest\.json|isotipo|.*\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf|css|js|xml|map)$)/i;

function toStoreUrl(slug: string, rest: string, query: string): string {
	return `https://${slug}.tiendly.lat/${rest.replace(/^\//, '')}${query}`;
}

export const handle: Handle = async ({ event, resolve }) => {
	const host = (event.request.headers.get('host') ?? '').split(':')[0].toLowerCase();
	const path = event.url.pathname;
	const query = event.url.search;
	const storeSlug = storeSlugFromHost(host);

	if (storeSlug) {
		if (STATIC_PATH.test(path)) return resolve(event);
		if (path.startsWith('/s/')) {
			const rest = path.slice(3);
			const other = rest.split('/')[0];
			if (other === storeSlug) {
				throw redirect(301, `https://${host}/${rest.slice(storeSlug.length)}${query}`);
			}
			throw redirect(301, `${SITE_URL}/s/${rest}${query}`);
		}
		if (path.startsWith('/t/')) throw redirect(301, toStoreUrl(storeSlug, path.slice(3), query));
		event.url = new URL(`/s/${storeSlug}${path}${query}`, event.url);
		return resolve(event);
	}

	if (host === 'www.tiendly.lat') {
		if (path.startsWith('/s/')) {
			const rest = path.slice(3);
			const slug = rest.split('/')[0];
			throw redirect(301, toStoreUrl(slug, rest.slice(slug.length), query));
		}
		if (path.startsWith('/t/')) {
			const rest = path.slice(3);
			const slug = rest.split('/')[0];
			throw redirect(301, toStoreUrl(slug, rest.slice(slug.length), query));
		}
		return resolve(event);
	}

	if (host === 'tiendly.lat') {
		throw redirect(301, `${SITE_URL}${path}${query}`);
	}

	return resolve(event);
};