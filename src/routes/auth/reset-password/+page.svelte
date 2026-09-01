<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let password = $state('');
	let confirmation = $state('');
	let error = $state('');
	let loading = $state(false);
	let ready = $state(false);
	let success = $state(false);

	onMount(() => {
		let active = true;
		void supabase.auth.getSession().then(({ data: sessionData }) => {
			if (active && sessionData.session) ready = true;
		});

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
		if (password.length < 6) { error = 'La contraseña debe tener al menos 6 caracteres.'; return; }
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
		{:else if ready}<form onsubmit={updatePassword} class="space-y-4 text-left mt-8">
			<label for="new-password" class="block text-sm font-medium text-body">Nueva contraseña</label>
			<input id="new-password" type="password" minlength="6" autocomplete="new-password" bind:value={password} class="input" required />
			<label for="confirm-password" class="block text-sm font-medium text-body">Repite la contraseña</label>
			<input id="confirm-password" type="password" minlength="6" autocomplete="new-password" bind:value={confirmation} class="input" required />
			{#if error}<p class="text-xs text-error bg-error/10 rounded-btn px-3 py-2">{error}</p>{/if}
			<button type="submit" disabled={loading} class="btn btn-3d btn-lg w-full">{loading ? 'Guardando…' : 'Guardar contraseña'}</button>
		</form>{:else}<p class="text-sm text-muted">El enlace no es válido o ya expiró.</p>{/if}
	</div>
</div>
