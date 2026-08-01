import { supabase } from '$lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

let session = $state<Session | null>(null);
let ready = $state(false);
let initialized = false;

function init() {
	if (initialized) return;
	initialized = true;
	supabase.auth.getSession().then(({ data }) => {
		session = data.session;
		ready = true;
	});
	supabase.auth.onAuthStateChange((_event, s) => {
		session = s;
	});
}

async function signOut() {
	await supabase.auth.signOut();
	session = null;
}

export const auth = {
	get session() { return session; },
	get ready() { return ready; },
	init,
	signOut,
};
