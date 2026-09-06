import { supabase, createAdminClient } from '$lib/supabase/server';
import { error, redirect } from '@sveltejs/kit';
import { planFromProfile } from '$lib/plans';

export const load = async ({ params, url, cookies }) => {
	const token = queryToken ?? cookies.get(cookieName);

	if (queryToken) {
		cookies.set(cookieName, queryToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: `/@${params.username}`,
			maxAge: 600,
		});
		throw redirect(303, `/@${params.username}`);
	}

	const { data: normal } = await supabase
		.from('stores')
		.select('*')
		.eq('slug', params.username)
		.maybeSingle();

	let store = normal ?? null;

	if (!store && token) {
	}

	const { data: owner } = await supabase.from('profiles').select('plan').eq('id', store.owner_id).maybeSingle();

	return { store, ownerPlan: planFromProfile(owner?.plan) };
};
