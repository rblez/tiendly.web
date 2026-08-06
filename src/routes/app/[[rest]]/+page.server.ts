import { redirect } from '@sveltejs/kit';

export function load({ params, url }) {
	const rest = params.rest ?? '';
	const suffix = rest ? `/${rest}` : '';
	const qs = url.search;
	throw redirect(301, `/dash${suffix}${qs}`);
}
