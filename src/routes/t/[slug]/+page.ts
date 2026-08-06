import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	redirect(301, `/@${params.slug}`);
}
