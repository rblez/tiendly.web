import { supabase } from '$lib/supabase/server';

export const POST = async ({ params }) => {
	const { data: visits } = await supabase.rpc('increment_store_visit', { p_slug: params.slug });
	return new Response(JSON.stringify({ visits }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
