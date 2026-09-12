import { supabase } from '$lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { PlanId } from '$lib/plans';
import { planFromProfile } from '$lib/plans';
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
			plan = planFromProfile(data.plan);
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

/**
 * Hidrata una sesión falsa para poder navegar el panel en desarrollo local
 * sin backend. Nunca hace peticiones de red y nunca se llama en producción:
 * solo se invoca desde el layout del dashboard cuando el bypass explícito
 * de desarrollo está activo.
 */
function hydrateLocalDemoSession(userId: string) {
	if (initialized) return;
	initialized = true;
	session = {
		access_token: 'demo-local',
		refresh_token: 'demo-local',
		expires_in: 3600,
		token_type: 'bearer',
		user: { id: userId, email: 'demo-local@tiendly.lat' },
	} as unknown as Session;
	plan = 'estandar';
	profile = {
		id: userId,
		name: 'Cuenta de prueba',
		phone: '+53 5555 5555',
		avatar_url: null,
		plan: 'estandar',
		created_at: new Date().toISOString(),
	};
	ready = true;
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
		ready = true;
	});
}

async function refresh() {
	const { data } = await supabase.auth.getSession();
	session = data.session;
	if (session) await loadProfile(session.user.id);
	ready = true;
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
	refresh,
	signOut,
	updateProfile,
	hydrateLocalDemoSession,
};
