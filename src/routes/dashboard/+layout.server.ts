import { redirect } from '@sveltejs/kit';
export const load = async ({ locals }) => {
	const { data, error } = await locals.supabase.auth.getUser();

	if (error || !data.user) {
		throw redirect(303, '/login');
	}

	return { user: data.user };
};

