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

	let claimed = $state(false);

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
		if (previewToken && !claimed) {
			claimed = true;
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

<div class="relative min-h-[calc(100vh-4rem)] overflow-hidden flex flex-col items-center justify-center px-4 py-16">
	<picture>
		<source srcset="/auth-bg-mobile.webp" media="(max-width: 768px)" />
		<img
			src="/auth-bg.webp"
			alt=""
			class="absolute inset-0 h-full w-full object-cover"
			fetchpriority="high"
		/>
	</picture>
	<div class="absolute inset-0 bg-black/75"></div>
	<div class="relative z-10 w-full max-w-sm fade-up" style="animation-delay: 0.05s">
		<div class="flex flex-col items-center text-center mb-7">
			<span class="h-14 w-14 rounded-2xl bg-ember text-white flex items-center justify-center text-2xl font-black mb-4 shadow-[0_10px_30px_rgba(34,197,94,0.35)]">T</span>
		</div>
		<div class="bg-card border border-hairline rounded-2xl p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.5)] fade-up" style="animation-delay: 0.12s">
			<div class="mb-7">
				<h1 class="text-2xl sm:text-[1.7rem] font-bold text-ink tracking-tight mb-1.5">Bienvenido de vuelta</h1>
				<p class="text-sm text-muted">Entra a tu cuenta para administrar tus tiendas.</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
					<div class="relative">
						<i class="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft text-lg pointer-events-none"></i>
						<input
							id="email"
							type="email"
							required
							bind:value={email}
							placeholder="tu@correo.com"
							autocomplete="email"
							class="w-full pl-10 pr-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
						/>
					</div>
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
						<i class="ri-lock-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft text-base pointer-events-none"></i>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							required
							bind:value={password}
							placeholder="••••••••"
							autocomplete="current-password"
							class="w-full pl-10 pr-11 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
							aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
						>
							<i class={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5 flex items-start gap-2">
						<i class="ri-error-warning-line mt-0.5"></i>
						<span>{error}</span>
					</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<i class="ri-loader-4-line animate-spin"></i>
					{/if}
					{loading ? 'Entrando...' : 'Entrar'}
					{#if !loading}
						<i class="ri-arrow-right-line"></i>
					{/if}
				</button>
			</form>
		</div>
		<p class="text-center text-sm text-white/60 mt-7 fade-up" style="animation-delay: 0.2s">
			¿No tienes cuenta? <a href={previewToken ? `/signup?preview=${previewToken}` : '/signup'} class="text-ember font-medium hover:text-ember-active no-underline">Crear cuenta gratis</a>
		</p>
	</div>
</div>

{#if resetOpen}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="presentation">
		<button type="button" class="absolute inset-0 bg-black/70 cursor-default" onclick={() => { resetOpen = false; resetSent = false; }} aria-label="Cerrar"></button>
		<div class="relative bg-card border border-hairline rounded-2xl w-full max-w-sm p-7 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)] fade-up" style="animation-delay: 0.05s">
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
						<div class="relative">
							<i class="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft text-base pointer-events-none"></i>
							<input
								id="reset-email"
								type="email"
								required
								bind:value={resetEmail}
								placeholder="tu@correo.com"
								class="w-full pl-10 pr-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-colors"
							/>
						</div>
					</div>
					{#if resetError}
						<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5 flex items-start gap-2">
							<i class="ri-error-warning-line mt-0.5"></i>
							<span>{resetError}</span>
						</p>
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
