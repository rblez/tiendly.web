import { redirect } from '@sveltejs/kit';

const DEMO_USER = {
	id: '00000000-0000-4000-8000-000000000001',
	email: 'demo-local@tiendly.lat',
} as const;

export const load = async ({ locals }) => {
	if (locals.localPanelBypass) {
		return { user: DEMO_USER, localPanelBypass: true };
	}

	const { data, error } = await locals.supabase.auth.getUser();

	if (error || !data.user) {
		throw redirect(303, '/login');
	}

	return { user: data.user, localPanelBypass: false };
};

