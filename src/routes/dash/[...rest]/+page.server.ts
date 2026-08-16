import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	const rest = params.rest ?? '';
	let dest = `/dashboard/${rest}`;
	if (rest.startsWith('store/')) {
		dest = `/dashboard/s/${rest.slice('store/'.length)}`;
	} else if (rest === 'store') {
		dest = '/dashboard';
	}
	throw redirect(301, dest);
}