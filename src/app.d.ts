import type { Database } from '$lib/database.types';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
	}
}

export type { Database };
