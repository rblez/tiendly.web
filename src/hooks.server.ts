import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { SITE_URL, DASH_URL, STORE_BASE } from '$lib/utils';

export const handle: Handle = async ({ event, resolve }) => {
	const host = (event.request.headers.get('host') ?? '').split(':')[0].toLowerCase();
	const path = event.url.pathname;
	const query = event.url.search;

	if (host === 's.tiendly.lat') {
		if (path.startsWith('/s/')) throw redirect(301, `${STORE_BASE}/${path.slice(3)}${query}`);
		if (path.startsWith('/t/')) throw redirect(301, `${STORE_BASE}/${path.slice(3)}${query}`);
		if (path !== '/' && !path.startsWith('/api/')) {
			event.url = new URL(`/s${path}${query}`, event.url);
		} else if (path === '/') {
			throw redirect(307, SITE_URL);
		}
		return resolve(event);
	}

	if (host === 'dash.tiendly.lat') {
		if (path === '/') throw redirect(301, '/app');
		if (path.startsWith('/s/')) throw redirect(301, `${STORE_BASE}/${path.slice(3)}${query}`);
		if (path.startsWith('/t/')) throw redirect(301, `${STORE_BASE}/${path.slice(3)}${query}`);
		if (path === '/pricing' || path === '/precios') throw redirect(301, `${SITE_URL}${path}${query}`);
		return resolve(event);
	}

	if (host === 'www.tiendly.lat') {
		throw redirect(301, `${SITE_URL}${path}${query}`);
	}

	if (host === 'tiendly.lat') {
		if (path.startsWith('/s/')) throw redirect(301, `${STORE_BASE}/${path.slice(3)}${query}`);
		if (path.startsWith('/t/')) throw redirect(301, `${STORE_BASE}/${path.slice(3)}${query}`);
		if (
			path === '/wizard' ||
			path === '/login' ||
			path === '/signup' ||
			path.startsWith('/app')
		) {
			throw redirect(301, `${DASH_URL}${path}${query}`);
		}
		return resolve(event);
	}

	return resolve(event);
};
