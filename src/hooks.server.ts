import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/database.types';

/**
 * Bypass de solo-desarrollo para poder navegar todo el panel sin backend real.
 * Se activa exclusivamente con `dev` (nunca en build de producción) y la
 * variable explícita `TIENDLY_LOCAL_PANEL_BYPASS=true`. Nunca se referencia
 * en el bundle de cliente.
 */
export const isLocalPanelBypassEnabled = dev && privateEnv.TIENDLY_LOCAL_PANEL_BYPASS === 'true';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.localPanelBypass = isLocalPanelBypassEnabled;

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
