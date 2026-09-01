import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
const PUBLIC_SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL || privateEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://preview-placeholder.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = publicEnv.PUBLIC_SUPABASE_ANON_KEY || privateEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'preview-placeholder-key';
const SUPABASE_SERVICE_ROLE_KEY = privateEnv.SUPABASE_SERVICE_ROLE_KEY || 'preview-placeholder-service-role-key';
import type { Database } from '$lib/database.types';

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export function createAdminClient() {
	return createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false },
	});
}
