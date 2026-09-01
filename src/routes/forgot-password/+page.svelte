<script lang="ts">
	import { supabase } from '$lib/supabase/client';

	let resetEmail = $state('');
	let resetSent = $state(false);
	let resetError = $state('');
	let loading = $state(false);

	async function handleReset(e: SubmitEvent) {
		e.preventDefault();
		resetError = '';
		if (!resetEmail.includes('@')) {
			resetError = 'Ingresa un correo válido.';
			return;
		}
		loading = true;
		const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
			redirectTo: `${location.origin}/auth/reset-password`,
		});
		loading = false;
		if (err) {
			resetError = err.message;
			return;
		}
		resetSent = true;
	}
</script>

<svelte:head>
	<title>Restablecer contraseña | Tiendly</title>
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
			<h1 class="text-3xl font-black tracking-tight text-ink mb-2">Restablecer contraseña</h1>
			<p class="text-sm text-muted">Te enviaremos un enlace al correo de tu cuenta.</p>
		</div>

		{#if resetSent}
			<div class="text-center fade-up" style="animation-delay: 0.12s">
				<h2 class="text-xl font-bold text-ink mb-1.5">Revisa tu correo</h2>
				<p class="text-sm text-muted mb-8">Te enviamos un enlace para restablecer tu contraseña.</p>
				<a
					href="/login"
					class="btn btn-3d btn-lg no-underline"
				>
					Volver al inicio de sesión
				</a>
			</div>
		{:else}
			<form onsubmit={handleReset} class="space-y-4 fade-up" style="animation-delay: 0.12s">
				<div>
					<label for="reset-email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
					<div class="relative">
						<i class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-soft text-lg pointer-events-none"></i>
						<input
							id="reset-email"
							type="email"
							required
							bind:value={resetEmail}
							placeholder="tu@correo.com"
							class="input pl-11 pr-4"
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
					disabled={loading}
					class="btn btn-3d btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<i class="ri-loader-4-line animate-spin"></i>
					{/if}
					{loading ? 'Enviando...' : 'Enviar enlace'}
					{#if !loading}{/if}
				</button>
			</form>
			<p class="text-center text-sm text-muted mt-8 fade-up" style="animation-delay: 0.2s">
				¿Recordaste tu contraseña? <a href="/login" class="text-ember font-medium hover:text-ember-active no-underline">Iniciar sesión</a>
			</p>
		{/if}
	</div>
</div>
