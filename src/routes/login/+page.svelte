<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';


	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);

	$effect(() => { auth.init(); });

	let claimed = $state(false);

	async function claimPreview(): Promise<string | null> {
		const { data } = await supabase.auth.getSession();
		const accessToken = data.session?.access_token;
		if (!accessToken) return null;

		navigate('/dashboard');
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
			if (err) {
				if (err.message.toLowerCase().includes('email not confirmed')) {
					const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
					if (!resendError) {
						navigate(`/auth/confirm?type=signup&email=${encodeURIComponent(email.trim())}`);
						return;
					}
				}
				error = friendlyAuthError(err.message);
				return;
			}
			await afterAuth();
		} catch {
			error = 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.';
		} finally {
			loading = false;
		}
	}

	function friendlyAuthError(message: string): string {
		const m = message.toLowerCase();
		if (m.includes('invalid login credentials') || m.includes('invalid email or password')) return 'Correo o contraseña incorrectos.';
		if (m.includes('email not confirmed')) return 'Confirma tu correo antes de entrar (revisa tu bandeja de entrada).';
		if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
		if (m.includes('user already registered')) return 'Ya existe una cuenta con ese correo. Inicia sesión.';
		if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
		return message;
	}
</script>

<svelte:head>
	<title>Iniciar sesión | Tiendly</title>
</svelte:head>

<style>
	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.fade-up {
		animation: fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
</style>

<div class="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm fade-up" style="animation-delay: 0.05s">
		<div class="flex flex-col items-center text-center mb-10">
			<img src="/tiendly-logo.webp" alt="Tiendly" class="h-10 object-contain mb-6" />
			<h1 class="text-3xl font-black tracking-tight text-ink mb-2">Bienvenido de vuelta</h1>
			<p class="text-sm text-muted">Entra a tu cuenta para administrar tus tiendas.</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4 fade-up" style="animation-delay: 0.12s">
			<div>
				<label for="email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
				<div class="relative">
					<i class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-soft text-lg pointer-events-none"></i>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="tu@correo.com"
						autocomplete="email"
						class="input pl-11 pr-4"
					/>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between mb-1.5">
					<label for="password" class="block text-sm font-medium text-body">Contraseña</label>
					<a
						href="/forgot-password"
						class="text-xs text-ember hover:text-ember-active transition-colors no-underline"
					>
						¿Olvidaste tu contraseña?
					</a>
				</div>
				<div class="relative">
					<i class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-soft text-base pointer-events-none"></i>
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						required
						bind:value={password}
						placeholder="••••••••"
						autocomplete="current-password"
						class="input pl-11 pr-12"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
						aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
					>
						<i class={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
					</button>
				</div>
			</div>

			{#if error}
				<p role="alert" aria-live="assertive" class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5 flex items-start gap-2">
					<i class="ri-error-warning-line mt-0.5"></i>
					<span>{error}</span>
				</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="btn btn-3d btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<i class="ri-loader-4-line animate-spin"></i>
				{/if}
				{loading ? 'Entrando...' : 'Entrar'}
				{#if !loading}{/if}
			</button>
		</form>
		<p class="text-center text-sm text-muted mt-8 fade-up" style="animation-delay: 0.2s">
			¿No tienes cuenta? <a href='/signup' class="text-ember font-medium hover:text-ember-active no-underline">Crear cuenta gratis</a>
		</p>
	</div>
</div>
