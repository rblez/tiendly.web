<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';

	let previewToken = $derived(new URLSearchParams($page.url.search).get('preview') ?? '');

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);
	let resetEmail = $state('');
	let resetSent = $state(false);
	let resetOpen = $state(false);
	let resetError = $state('');

	$effect(() => { auth.init(); });

	async function claimPreview(): Promise<string | null> {
		const { data } = await supabase.auth.getSession();
		const accessToken = data.session?.access_token;
		if (!accessToken) return null;
		const res = await fetch('/api/claim-preview', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
			body: JSON.stringify({ token: previewToken }),
		});
		if (!res.ok) return null;
		const body = await res.json().catch(() => null);
		return typeof body?.code === 'string' ? body.code : null;
	}

	async function afterAuth() {
		if (previewToken) {
			const storeCode = await claimPreview();
			if (storeCode) {
				goto(`/dash/store/${storeCode}?created=1`);
				return;
			}
		}
		goto('/dash');
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
		loading = false;
		if (err) {
			error = friendlyAuthError(err.message);
			return;
		}
		await afterAuth();
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

	async function handleReset(e: SubmitEvent) {
		e.preventDefault();
		resetError = '';
		if (!resetEmail.includes('@')) {
			resetError = 'Ingresa un correo válido.';
			return;
		}
		const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
			redirectTo: `${location.origin}/dash/profile?tab=general`,
		});
		if (err) {
			resetError = err.message;
			return;
		}
		resetSent = true;
	}
</script>

<svelte:head>
	<title>Iniciar sesión | Tiendly</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm">
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h1 class="text-xl font-bold text-ink mb-1">Bienvenido de vuelta</h1>
			<p class="text-sm text-muted mb-6">Entra a tu cuenta para administrar tus tiendas.</p>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="tu@correo.com"
						autocomplete="email"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-1.5">
						<label for="password" class="block text-sm font-medium text-body">Contraseña</label>
						<button
							type="button"
							onclick={() => (resetOpen = true)}
							class="text-xs text-ember hover:text-ember-active transition-colors cursor-pointer"
						>
							¿Olvidaste tu contraseña?
						</button>
					</div>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							required
							bind:value={password}
							placeholder="••••••••"
							autocomplete="current-password"
							class="w-full px-3.5 py-2.5 pr-11 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
							aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
						>
							<i class={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{error}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Entrando...' : 'Entrar'}
				</button>
			</form>
		</div>
		<p class="text-center text-sm text-muted mt-6">
			¿No tienes cuenta? <a href={previewToken ? `/signup?preview=${previewToken}` : '/signup'} class="text-ember hover:text-ember-active no-underline">Crear cuenta gratis</a>
		</p>
	</div>
</div>

{#if resetOpen}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="presentation">
		<button type="button" class="absolute inset-0 bg-black/60 cursor-default" onclick={() => { resetOpen = false; resetSent = false; }} aria-label="Cerrar"></button>
		<div class="relative bg-card border border-hairline rounded-card w-full max-w-sm p-6 sm:p-8">
			<button onclick={() => { resetOpen = false; resetSent = false; }} class="absolute top-4 right-4 text-muted hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
				<i class="ri-close-line text-xl"></i>
			</button>
			{#if resetSent}
				<div class="text-center">
					<div class="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<i class="ri-mail-send-line text-2xl text-ember"></i>
					</div>
					<h2 class="text-lg font-bold text-ink mb-1">Revisa tu correo</h2>
					<p class="text-sm text-muted">Te enviamos un enlace para restablecer tu contraseña.</p>
				</div>
			{:else}
				<h2 class="text-lg font-bold text-ink mb-1">Restablecer contraseña</h2>
				<p class="text-sm text-muted mb-5">Te enviaremos un enlace al correo de tu cuenta.</p>
				<form onsubmit={handleReset} class="space-y-4">
					<div>
						<label for="reset-email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
						<input
							id="reset-email"
							type="email"
							required
							bind:value={resetEmail}
							placeholder="tu@correo.com"
							class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
						/>
					</div>
					{#if resetError}
						<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{resetError}</p>
					{/if}
					<button
						type="submit"
						class="w-full bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer"
					>
						Enviar enlace
					</button>
				</form>
			{/if}
		</div>
	</div>
{/if}
