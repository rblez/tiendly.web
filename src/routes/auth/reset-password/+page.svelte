<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let password = $state('');
	let confirmation = $state('');
	let showPassword = $state(false);
	let showConfirmation = $state(false);
	let error = $state('');
	let loading = $state(false);
	let ready = $state(false);
	let success = $state(false);
	let callbackError = $derived($page.url.searchParams.get('error') ?? '');

	onMount(() => {
		let active = true;
		const hash = new URLSearchParams(window.location.hash.slice(1));
		const accessToken = hash.get('access_token');
		const refreshToken = hash.get('refresh_token');

		const establishRecoverySession = async () => {
			if (accessToken && refreshToken) {
				const { error: sessionError } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: refreshToken,
				});
				if (!sessionError) window.history.replaceState({}, '', window.location.pathname);
			}
			const { data: sessionData } = await supabase.auth.getSession();
			if (active && sessionData.session) ready = true;
		};
		void establishRecoverySession();

		const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) ready = true;
		});
		return () => {
			active = false;
			listener.subscription.unsubscribe();
		};
	});

	async function updatePassword(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (password.length < 8) { error = 'La contraseña debe tener al menos 8 caracteres.'; return; }
		if (password !== confirmation) { error = 'Las contraseñas no coinciden.'; return; }
		loading = true;
		const { error: err } = await supabase.auth.updateUser({ password });
		loading = false;
		if (err) { error = 'No se pudo actualizar la contraseña. Solicita un enlace nuevo.'; return; }
		success = true;
		setTimeout(() => goto('/login'), 1200);
	}
</script>

<svelte:head><title>Crear nueva contraseña | Tiendly</title></svelte:head>
<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm text-center">
		<a href="/" aria-label="Ir al inicio de Tiendly" class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 shadow-sm mb-8">
			<img src="/tiendly-logo.webp" alt="Tiendly" class="h-10 w-auto object-contain" />
		</a>
		<h1 class="text-3xl font-black text-ink mb-2">Nueva contraseña</h1>
		{#if success}<p class="text-sm text-ember">Contraseña actualizada. Volviendo al inicio de sesión…</p>
		{:else if callbackError}<div class="mt-8 rounded-btn border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{callbackError}</div><a href="/forgot-password" class="btn btn-3d btn-lg mt-5 inline-flex no-underline">Solicitar otro enlace</a>
		{:else if ready}<form onsubmit={updatePassword} class="space-y-4 text-left mt-8">
			<label for="new-password" class="block text-sm font-medium text-body">Nueva contraseña</label>
			<div class="relative">
				<input id="new-password" type={showPassword ? 'text' : 'password'} minlength="8" autocomplete="new-password" bind:value={password} class="input pr-12" required />
				<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onclick={() => (showPassword = !showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><i class={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i></button>
			</div>
			<p class="text-xs text-muted-soft">Usa al menos 8 caracteres.</p>
			<label for="confirm-password" class="block text-sm font-medium text-body">Repite la contraseña</label>
			<div class="relative">
				<input id="confirm-password" type={showConfirmation ? 'text' : 'password'} minlength="8" autocomplete="new-password" bind:value={confirmation} class="input pr-12" required />
				<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onclick={() => (showConfirmation = !showConfirmation)} aria-label={showConfirmation ? 'Ocultar confirmación' : 'Mostrar confirmación'}><i class={showConfirmation ? 'ri-eye-off-line' : 'ri-eye-line'}></i></button>
			</div>
			{#if error}<p class="text-xs text-error bg-error/10 rounded-btn px-3 py-2">{error}</p>{/if}
			<button type="submit" disabled={loading} class="btn btn-3d btn-lg w-full">{loading ? 'Guardando…' : 'Guardar contraseña'}</button>
		</form>{:else}<p class="text-sm text-muted">El enlace no es válido o ya expiró.</p>{/if}
	</div>
</div>
