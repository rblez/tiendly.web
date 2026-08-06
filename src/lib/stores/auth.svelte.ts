import { supabase } from '$lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { PlanId } from '$lib/plans';
import type { Profile } from '$lib/types';

	let session = $state<Session | null>(null);
	let plan = $state<PlanId>('free');
	let profile = $state<Profile | null>(null);
	let ready = $state(false);
	let initialized = false;

	async function loadProfile(userId: string) {
		const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
		if (data) {
			profile = data as Profile;
			const map: Record<string, PlanId> = {
				free: 'free',
				pro: 'creator',
				premium: 'business',
				creator: 'creator',
				business: 'business',
			};
			plan = map[data.plan] ?? 'free';
		}
	}

	async function updateProfile(patch: Partial<Pick<Profile, 'name' | 'phone' | 'avatar_url'>>) {
		if (!session) return;
		const { data, error } = await supabase
			.from('profiles')
			.update(patch)
			.eq('id', session.user.id)
			.select('*')
			.single();
		if (!error && data) profile = data as Profile;
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
			profile = null;
			loadProfile(s.user.id);
		} else {
			profile = null;
		}
	});
}

async function signOut() {
	await supabase.auth.signOut();
	session = null;
	plan = 'free';
	profile = null;
}

export const auth = {
	get session() { return session; },
	get plan() { return plan; },
	get profile() { return profile; },
	get ready() { return ready; },
	init,
	signOut,
	updateProfile,
};
