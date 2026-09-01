import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const loadedEnv = loadEnv(mode, process.cwd(), '');
	return {
		define: {
			'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(loadedEnv.NEXT_PUBLIC_SUPABASE_URL ?? ''),
			'import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(loadedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''),
		},
		plugins: [tailwindcss(), sveltekit()],
		server: {
			host: true,
			allowedHosts: true,
		},
	};
});
