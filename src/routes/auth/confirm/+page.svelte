<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let email = $derived($page.url.searchParams.get('email') ?? '');
	let type = $derived(($page.url.searchParams.get('type') ?? 'signup') as 'signup' | 'email');
	let token = $state('');
	let error = $state('');
	let info = $state('');
	let loading = $state(false);

	async function verify(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		info = '';
		token = token.trim();
		if (!/^\d{6}$/.test(token)) {
			error = 'Escribe el código de 6 dígitos.';
			return;
		}
		loading = true;
		const { error: err } = await supabase.auth.verifyOtp({ email, token, type });
		loading = false;
		if (err) {
			error = err.message.toLowerCase().includes('expired') ? 'El código expiró. Solicita uno nuevo.' : 'El código no es válido.';
			return;
		}
		info = 'Correo confirmado. Redirigiendo…';
		await goto('/dashboard');
	}

	async function resend() {
		error = '';
		const { error: err } = await supabase.auth.resend({ type: type === 'signup' ? 'signup' : 'email_change', email });
		info = err ? 'No se pudo reenviar el código. Espera un momento.' : 'Código reenviado. Revisa tu correo.';
	}
</script>

<svelte:head><title>Confirmar correo | Tiendly</title></svelte:head>
<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm text-center">
		<img src="/tiendly-logo.webp" alt="Tiendly" class="h-10 object-contain mx-auto mb-8" />
		<h1 class="text-3xl font-black text-ink mb-2">Confirma tu correo</h1>
		<p class="text-sm text-muted mb-8">Escribe el código que enviamos a <strong>{email}</strong>.</p>
		<form onsubmit={verify} class="space-y-4">
			<label for="otp" class="sr-only">Código de confirmación</label>
			<input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" bind:value={token} oninput={(e) => (token = e.currentTarget.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" class="input text-center text-2xl tracking-[0.4em]" required />
			{#if error}<p class="text-xs text-error bg-error/10 rounded-btn px-3 py-2">{error}</p>{/if}
			{#if info}<p class="text-xs text-ember bg-ember/10 rounded-btn px-3 py-2">{info}</p>{/if}
			<button type="submit" disabled={loading} class="btn btn-3d btn-lg w-full">{loading ? 'Confirmando…' : 'Confirmar código'}</button>
		</form>
		<button type="button" onclick={resend} class="mt-5 text-sm text-ember hover:text-ember-active">Reenviar código</button>
	</div>
</div>
