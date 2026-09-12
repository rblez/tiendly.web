import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { data, error } = await locals.supabase.auth.getUser();
	if (error || !data.user) throw redirect(303, '/login');

	const { data: store } = await locals.supabase
		.from('stores')
		.select('code')
		.eq('owner_id', data.user.id)
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();

	if (store?.code) throw redirect(303, `/dashboard/s/${store.code}`);
	throw redirect(303, '/wizard');
};
