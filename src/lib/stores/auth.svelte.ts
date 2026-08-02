import { supabase } from '$lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { PlanId } from '$lib/plans';

let session = $state<Session | null>(null);
let plan = $state<PlanId>('free');
let ready = $state(false);
let initialized = false;

async function loadProfile(userId: string) {
	const { data } = await supabase.from('profiles').select('plan').eq('id', userId).maybeSingle();
	if (data && (data.plan === 'free' || data.plan === 'pro')) plan = data.plan;
}

function init() {
	if (initialized) return;
	initialized = true;
	supabase.auth.getSession().then(({ data }) => {
		session = data.session;
		if (session) loadProfile(session.user.id);
		ready = true;
	});
	supabase.auth.onAuthStateChange((_event, s) => {
		session = s;
		if (s) {
			plan = 'free';
			loadProfile(s.user.id);
		}
	});
}

async function signOut() {
	await supabase.auth.signOut();
	session = null;
	plan = 'free';
}

export const auth = {
	get session() { return session; },
	get plan() { return plan; },
	get ready() { return ready; },
	init,
	signOut,
};
