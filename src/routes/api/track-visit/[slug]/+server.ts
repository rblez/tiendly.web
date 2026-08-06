import { supabase } from '$lib/supabase/server';

export const POST = async ({ params, url }) => {
	const slug = params.slug.trim();
	if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
		return new Response(JSON.stringify({ error: 'Slug inválido' }), { status: 400 });
	}
	const clean = (v: string | null) => (v && v.length <= 120 ? v.slice(0, 120) : null);
	const { data: visits, error } = await supabase.rpc('track_visit', {
		p_slug: slug,
		p_utm_source: clean(url.searchParams.get('utm_source')),
		p_utm_medium: clean(url.searchParams.get('utm_medium')),
		p_utm_campaign: clean(url.searchParams.get('utm_campaign')),
	});
	if (error || visits === null) {
		return new Response(JSON.stringify({ error: 'Tienda no encontrada' }), { status: 404 });
	}
	return new Response(JSON.stringify({ visits }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
