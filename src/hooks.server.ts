import * as Sentry from '@sentry/sveltekit';
import { createServerClient } from '@supabase/ssr';
import { sequence } from '@sveltejs/kit/hooks';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/database.types';

const SENTRY_DSN = privateEnv.SENTRY_DSN;
const SENTRY_ENVIRONMENT = privateEnv.SENTRY_ENVIRONMENT || 'production';

// En Cloudflare Workers, @sentry/sveltekit se resuelve al build "workerd"
// (ver ssr.resolve.conditions en vite.config.ts), que no exporta `init`
// sino `initCloudflareSentryHandle`. Llamar a `Sentry.init` revienta el
// Worker en el top-level del módulo y tumba todas las rutas (error 1101).
const sentryHandle: Handle =
	SENTRY_DSN && typeof Sentry.initCloudflareSentryHandle === 'function'
		? Sentry.initCloudflareSentryHandle({ dsn: SENTRY_DSN, environment: SENTRY_ENVIRONMENT })
		: async ({ event, resolve }) => resolve(event);

export const handleError = Sentry.handleErrorWithSentry();

const supabaseHandle: Handle = async ({ event, resolve }) => {
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

export const handle = sequence(sentryHandle, supabaseHandle);
