import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/server';

export const load = async () => {
	const { data, error } = await supabase.auth.getUser();

	if (error || !data.user) {
		throw redirect(303, '/login');
	}

	return { user: data.user };
};

