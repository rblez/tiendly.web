import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/server';

export const GET = async ({ url }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next');
	const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) throw redirect(303, safeNext);
	}

	throw redirect(303, '/login?error=auth_callback');
};
