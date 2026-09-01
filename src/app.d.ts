import type { Database } from '$lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			supabase: SupabaseClient<Database>;
		}
	}
}

export type { Database };
