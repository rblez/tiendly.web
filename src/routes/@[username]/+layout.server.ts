import { supabase, createAdminClient } from '$lib/supabase/server';
import { error } from '@sveltejs/kit';

export const load = async ({ params, url }) => {
	const token = url.searchParams.get('preview');

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
		return { store, preview: { token: token ?? '', expiresAt: store.preview_expires_at } };
	}

	return { store, preview: null };
};
