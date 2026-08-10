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
			redirectTo: `${location.origin}/dash/profile?tab=general`,
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
			<img src="/isotipo.png" alt="Tiendly" class="h-16 w-16 object-contain mb-6" />
			<h1 class="text-3xl font-black tracking-tight text-ink mb-2">Restablecer contraseña</h1>
			<p class="text-sm text-muted">Te enviaremos un enlace al correo de tu cuenta.</p>
		</div>

		{#if resetSent}
			<div class="text-center fade-up" style="animation-delay: 0.12s">
				<div class="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-5">
					<i class="ri-mail-send-line text-3xl text-ember"></i>
				</div>
				<h2 class="text-xl font-bold text-ink mb-1.5">Revisa tu correo</h2>
				<p class="text-sm text-muted mb-8">Te enviamos un enlace para restablecer tu contraseña.</p>
				<a
					href="/login"
					class="inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-3.5 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] no-underline"
				>
					<i class="ri-arrow-left-line"></i>
					Volver al inicio de sesión
				</a>
			</div>
		{:else}
			<form onsubmit={handleReset} class="space-y-4 fade-up" style="animation-delay: 0.12s">
				<div>
					<label for="reset-email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
					<div class="relative">
						<i class="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-muted-soft text-lg pointer-events-none"></i>
						<input
							id="reset-email"
							type="email"
							required
							bind:value={resetEmail}
							placeholder="tu@correo.com"
							class="w-full pl-11 pr-4 py-3 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
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
					class="w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-3.5 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<i class="ri-loader-4-line animate-spin"></i>
					{/if}
					{loading ? 'Enviando...' : 'Enviar enlace'}
					{#if !loading}
						<i class="ri-arrow-right-line"></i>
					{/if}
				</button>
			</form>
			<p class="text-center text-sm text-muted mt-8 fade-up" style="animation-delay: 0.2s">
				¿Recordaste tu contraseña? <a href="/login" class="text-ember font-medium hover:text-ember-active no-underline">Iniciar sesión</a>
			</p>
		{/if}
	</div>
</div>
