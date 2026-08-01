<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/Logo.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	$effect(() => { auth.init(); });

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		const { error: err } = await supabase.auth.signInWithPassword({ email, password });
		loading = false;
		if (err) {
			error = err.message;
			return;
		}
		goto('/app');
	}
</script>

<svelte:head>
	<title>Iniciar sesión | Tiendly</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm">
		<div class="flex justify-center mb-8">
			<Logo size="h-12" />
		</div>
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h1 class="text-xl font-bold text-ink mb-1">Bienvenido de vuelta</h1>
			<p class="text-sm text-muted mb-6">Accede a tu cuenta de Tiendly</p>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="tu@correo.com"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
				</div>
				<div>
					<label for="password" class="block text-sm font-medium text-body mb-1.5">Contraseña</label>
					<input
						id="password"
						type="password"
						required
						bind:value={password}
						placeholder="••••••••"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
				</div>

				{#if error}
					<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{error}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-ember text-white px-5 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Entrando...' : 'Entrar'}
				</button>
			</form>
		</div>
		<p class="text-center text-sm text-muted mt-6">
			¿No tienes cuenta? <a href="/signup" class="text-ember hover:text-ember-active no-underline">Crear cuenta gratis</a>
		</p>
	</div>
</div>
