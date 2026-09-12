import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next');
	const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) throw redirect(303, safeNext);
	}

	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	if (tokenHash && (type === 'signup' || type === 'recovery' || type === 'email')) {
		const { error } = await locals.supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type: type === 'signup' ? 'signup' : type === 'recovery' ? 'recovery' : 'email',
		});
		if (!error) throw redirect(303, type === 'recovery' ? '/auth/reset-password' : safeNext);
	}

	throw redirect(303, `/auth/reset-password?error=${encodeURIComponent('El enlace expiró o no es válido. Solicita uno nuevo.')}`);
};
