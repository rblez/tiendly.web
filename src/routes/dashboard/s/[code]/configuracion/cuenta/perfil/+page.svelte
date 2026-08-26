<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let storeCode = $derived($page.params.code ?? '');
	let name = $state('');
	let phone = $state('');
	let uploading = $state(false);
	let saving = $state(false);
	let msg = $state('');
	let error = $state('');

	$effect(() => {
		if (auth.profile) {
			name = auth.profile.name;
			phone = auth.profile.phone ?? '';
		}
	});

	async function handleAvatar(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !auth.session) return;
		uploading = true;
		error = '';
		try {
			const url = await (await import('$lib/utils')).uploadImage(file, 'logo');
			await auth.updateProfile({ avatar_url: url });
		} catch {
			error = 'No se pudo subir la foto. Intenta con otra imagen.';
		}
		uploading = false;
		input.value = '';
	}

	function removeAvatar() {
		auth.updateProfile({ avatar_url: null });
	}

	async function save() {
		if (saving) return;
		error = '';
		msg = '';
		saving = true;
		try {
			await auth.updateProfile({ name: name.trim(), phone: phone.trim() || null });
			msg = 'Perfil actualizado.';
			setTimeout(() => (msg = ''), 2000);
		} catch {
			error = 'No se pudo guardar el perfil.';
		}
		saving = false;
	}
</script>

<svelte:head><title>Perfil | Tiendly</title></svelte:head>

<SettingsHeader backHref={`../cuenta`} />

<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<div class="bg-card border border-hairline rounded-card p-5 space-y-5">
		<div class="flex items-center gap-4">
			<div class="h-16 w-16 flex-shrink-0 rounded-full overflow-hidden bg-canvas border border-hairline flex items-center justify-center">
				{#if auth.profile?.avatar_url}
					<img src={auth.profile.avatar_url} alt="Foto de perfil" class="w-full h-full object-cover" />
				{:else}
					<span class="text-2xl font-black text-ember">{(name || 'T').charAt(0).toUpperCase()}</span>
				{/if}
			</div>
			<div class="space-y-1.5">
				<label class="btn btn-3d btn-sm cursor-pointer">
					{#if uploading}<i class="ri-loader-4-line animate-spin"></i>{:else}<i class="ri-camera-line"></i>{/if}
					{uploading ? 'Subiendo...' : auth.profile?.avatar_url ? 'Cambiar' : 'Subir foto'}
					<input type="file" accept="image/*" class="hidden" onchange={handleAvatar} />
				</label>
				{#if auth.profile?.avatar_url}
					<button onclick={removeAvatar} class="block text-xs text-muted-soft hover:text-error transition-colors cursor-pointer">Quitar foto</button>
				{/if}
			</div>
		</div>

		<div>
			<label for="p-name" class="block text-sm font-medium text-body mb-1.5">Nombre</label>
			<input id="p-name" type="text" bind:value={name} placeholder="Tu nombre" class="input w-full" />
		</div>
		<div>
			<label for="p-phone" class="block text-sm font-medium text-body mb-1.5">Teléfono <span class="text-muted-soft">(opcional)</span></label>
			<input id="p-phone" type="tel" bind:value={phone} placeholder="Ej: +53 5 1234567" class="input w-full" />
		</div>
		<div>
			<label for="p-email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
			<input id="p-email" type="email" value={auth.session?.user.email ?? ''} disabled class="input w-full cursor-not-allowed" />
			<p class="text-xs text-muted-soft mt-1.5">Para cambiarlo usa Seguridad.</p>
		</div>
	</div>

	{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
	{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}

	<button onclick={save} disabled={saving} class="btn btn-3d btn-md w-full disabled:opacity-50">
		{saving ? 'Guardando...' : 'Guardar cambios'}
	</button>
</div>
