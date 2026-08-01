<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/Logo.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let info = $state('');
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		info = '';
		loading = true;
		const { data, error: err } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { name } },
		});
		loading = false;
		if (err) {
			error = err.message;
			return;
		}
		if (data.session) {
			goto('/app/new');
		} else {
			info = 'Revisa tu correo para confirmar la cuenta, luego inicia sesión.';
		}
	}
</script>

<svelte:head>
	<title>Crear cuenta | Tiendly</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm">
		<div class="flex justify-center mb-8">
			<Logo size="h-12" />
		</div>
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h1 class="text-xl font-bold text-ink mb-1">Crea tu cuenta</h1>
			<p class="text-sm text-muted mb-6">Gratis. Tu tienda estará lista en 5 minutos.</p>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-body mb-1.5">Tu nombre</label>
					<input
						id="name"
						type="text"
						required
						bind:value={name}
						placeholder="Ana Pérez"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
				</div>
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
						minlength="6"
						bind:value={password}
						placeholder="Mínimo 6 caracteres"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
				</div>

				{#if error}
					<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{error}</p>
				{/if}
				{#if info}
					<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-2.5">{info}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-ember text-white px-5 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Creando cuenta...' : 'Crear cuenta'}
				</button>
			</form>
		</div>
		<p class="text-center text-sm text-muted mt-6">
			¿Ya tienes cuenta? <a href="/login" class="text-ember hover:text-ember-active no-underline">Iniciar sesión</a>
		</p>
	</div>
</div>
