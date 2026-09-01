import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
const PUBLIC_SUPABASE_URL = env.PUBLIC_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://preview-placeholder.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'preview-placeholder-key';
import type { Database } from '$lib/database.types';

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
	},
});
