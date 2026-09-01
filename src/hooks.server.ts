import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/database.types';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createServerClient<Database>(
		publicEnv.PUBLIC_SUPABASE_URL || privateEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://preview-placeholder.supabase.co',
		publicEnv.PUBLIC_SUPABASE_ANON_KEY || privateEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'preview-placeholder-key',
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => event.cookies.set(name, value, { ...options, path: '/' })),
			},
		},
	);
	event.locals.supabase = supabase;

	const response = await resolve(event);
	if (!event.route) {
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	}
	return response;
};
