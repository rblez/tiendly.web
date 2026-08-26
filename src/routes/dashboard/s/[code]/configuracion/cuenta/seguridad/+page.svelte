<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase/client';

	let storeCode = $derived($page.params.code ?? '');
	let password = $state('');
	let newEmail = $state('');
	let msg = $state('');
	let error = $state('');
	let busy = $state(false);

	async function changePassword() {
		error = '';
		msg = '';
		if (password.length < 6) {
			error = 'La contraseña debe tener al menos 6 caracteres.';
			return;
		}
		busy = true;
		const { error: err } = await supabase.auth.updateUser({ password });
		busy = false;
		if (err) {
			error = err.message;
			return;
		}
		password = '';
		msg = 'Contraseña actualizada.';
		setTimeout(() => (msg = ''), 2500);
	}

	async function changeEmail() {
		error = '';
		msg = '';
		if (!newEmail.includes('@')) {
			error = 'Ingresa un correo válido.';
			return;
		}
		busy = true;
		const { error: err } = await supabase.auth.updateUser({ email: newEmail.trim() });
		busy = false;
		if (err) {
			error = err.message;
			return;
		}
		newEmail = '';
		msg = 'Te enviamos un correo para confirmar el cambio.';
		setTimeout(() => (msg = ''), 3000);
	}

	async function signOutOthers() {
		busy = true;
		await supabase.auth.signOut({ scope: 'others' });
		busy = false;
		msg = 'Sesiones cerradas en los demás dispositivos.';
		setTimeout(() => (msg = ''), 2500);
	}

	let deleteConfirm = $state(false);
	let deleting = $state(false);

	async function deleteAccount() {
		if (!deleteConfirm || !auth.session) return;
		deleting = true;
		error = '';
		try {
			const { error: err } = await supabase.rpc('delete_account', { p_user_id: auth.session.user.id });
			if (err) throw err;
			await auth.signOut();
			goto('/');
		} catch {
			error = 'No se pudo eliminar la cuenta. Intenta de nuevo.';
			deleting = false;
		}
	}
</script>

<svelte:head><title>Seguridad | Tiendly</title></svelte:head>

<SettingsHeader backHref={`../cuenta`} />

<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<div class="bg-card border border-hairline rounded-card p-5 space-y-3">
		<p class="text-sm font-medium text-body">Cambiar contraseña</p>
		<input type="password" bind:value={password} placeholder="Nueva contraseña (mín. 6 caracteres)" class="input w-full" />
		<button onclick={changePassword} disabled={busy || !password} class="btn btn-3d btn-md w-full disabled:opacity-40">Actualizar contraseña</button>
	</div>

	<div class="bg-card border border-hairline rounded-card p-5 space-y-3">
		<p class="text-sm font-medium text-body">Cambiar correo</p>
		<p class="text-xs text-muted-soft">Correo actual: <span class="text-body">{auth.session?.user.email ?? ''}</span></p>
		<input type="email" bind:value={newEmail} placeholder="nuevo@correo.com" class="input w-full" />
		<button onclick={changeEmail} disabled={busy || !newEmail} class="btn btn-secondary btn-md w-full disabled:opacity-40">Actualizar correo</button>
	</div>

	<div class="bg-card border border-hairline rounded-card p-5 space-y-3">
		<p class="text-sm font-medium text-body">Sesiones</p>
		<p class="text-xs text-muted-soft">Cierra el acceso a tu cuenta en otros dispositivos. Tu sesión actual se mantiene.</p>
		<button onclick={signOutOthers} disabled={busy} class="btn btn-secondary btn-md w-full disabled:opacity-40">Cerrar sesión en otros dispositivos</button>
	</div>

	{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}
	{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}

	<div class="bg-card border border-error/30 rounded-card p-5 space-y-3 mt-8">
		<p class="text-sm font-semibold text-error">Eliminar cuenta</p>
		<p class="text-xs text-muted leading-relaxed">
			Se borrarán tu perfil, todas tus tiendas, productos, pedidos y estadísticas. Esta acción no se puede deshacer.
		</p>
		<label class="flex items-start gap-2.5 cursor-pointer">
			<input type="checkbox" bind:checked={deleteConfirm} class="mt-0.5 w-4 h-4 accent-ember cursor-pointer" />
			<span class="text-xs text-body">Entiendo que esto eliminará mi cuenta y toda mi información permanentemente.</span>
		</label>
		<button
			onclick={deleteAccount}
			disabled={!deleteConfirm || deleting}
			class="w-full inline-flex items-center justify-center bg-error text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-40"
		>
			{deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
		</button>
	</div>
</div>
