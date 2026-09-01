import { supabase, createAdminClient } from '$lib/supabase/server';
import { error, redirect } from '@sveltejs/kit';
import { planFromProfile } from '$lib/plans';

export const load = async ({ params, url, cookies }) => {
	const cookieName = `preview_${params.username}`;
	const queryToken = url.searchParams.get('preview');
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
		const { data: preview } = await createAdminClient()
			.from('stores')
			.select('*')
			.eq('slug', params.username)
			.eq('preview_token', token)
			.maybeSingle();
		store = preview ?? null;
	}

	if (!store) throw error(404, 'Tienda no encontrada');

	if (!store.owner_id) {
		if (store.preview_expires_at && new Date(store.preview_expires_at).getTime() < Date.now()) {
			await createAdminClient().from('stores').delete().eq('id', store.id);
			throw error(404, 'La vista previa expiró');
		}
		return { store, ownerPlan: null, preview: { token: token ?? '', expiresAt: store.preview_expires_at } };
	}

	const { data: owner } = await supabase.from('profiles').select('plan').eq('id', store.owner_id).maybeSingle();

	return { store, ownerPlan: planFromProfile(owner?.plan), preview: null };
};
