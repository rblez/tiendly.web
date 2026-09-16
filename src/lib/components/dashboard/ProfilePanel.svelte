<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { uploadImage } from '$lib/utils';
	import { PLAN_MAP } from '$lib/plans';
	import { supabase } from '$lib/supabase/client';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import { onMount } from 'svelte';

	let name = $state('');
	let phone = $state('');
	let uploading = $state(false);
	let saving = $state(false);
	let message = $state('');
	let error = $state('');
	let cropFile = $state<File | null>(null);
	let storesCount = $state(0);
	let productsCount = $state(0);
	const plan = $derived(PLAN_MAP[auth.plan] ?? PLAN_MAP.free);

	$effect(() => {
		if (auth.profile) {
			name = auth.profile.name;
			phone = auth.profile.phone ?? '';
		}
	});

	onMount(async () => {
		if (!auth.session) return;
		const { data: stores } = await supabase.from('stores').select('id').eq('owner_id', auth.session.user.id);
		storesCount = stores?.length ?? 0;
		const ids = (stores ?? []).map((store) => store.id);
		if (ids.length) {
			const { data: products } = await supabase.from('products').select('store_id').in('store_id', ids);
			productsCount = products?.length ?? 0;
		}
	});

	async function handleAvatar(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) cropFile = file;
		input.value = '';
	}

	async function confirmAvatar(file: File) {
		cropFile = null;
		if (!auth.session) return;
		uploading = true;
		try {
			const url = await uploadImage(file, 'logo');
			await auth.updateProfile({ avatar_url: url });
		} catch {
			error = 'No se pudo subir la foto.';
		} finally {
			uploading = false;
		}
	}

	async function saveProfile() {
		saving = true;
		error = '';
		message = '';
		try {
			await auth.updateProfile({ name: name.trim(), phone: phone.trim() || null });
			message = 'Perfil actualizado.';
		} catch {
			error = 'No se pudo guardar el perfil.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Perfil | Tiendly</title></svelte:head>

<section class="mx-auto max-w-2xl px-4 pb-12 pt-7 sm:px-6">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-ink">Perfil</h1><p class="mt-1 text-sm text-muted">Tus datos personales y resumen de cuenta.</p>
	</div>

	<SettingsSection title="Datos personales">
		<div class="space-y-7 p-5 sm:p-8">
			<div class="flex items-center gap-5">
				<div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-canvas text-2xl font-black text-ember">{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Foto de perfil" class="h-full w-full object-cover" />{:else}{name ? name.charAt(0).toUpperCase() : 'T'}{/if}</div>
				<label class="btn btn-3d btn-sm cursor-pointer">{uploading ? 'Subiendo...' : 'Cambiar foto'}<input type="file" accept="image/*" class="hidden" onchange={handleAvatar} /></label>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="text-sm font-medium text-body">Nombre personal<input bind:value={name} placeholder="Tu nombre" class="input mt-1.5" /></label>
				<label class="text-sm font-medium text-body">Teléfono personal <span class="text-muted-soft">(opcional)</span><input bind:value={phone} type="tel" placeholder="Ej: +53 5 1234567" class="input mt-1.5" /></label>
			</div>
			<div><p class="text-sm font-medium text-body">Correo</p><p class="mt-1.5 rounded-btn border border-hairline bg-canvas px-3 py-2.5 text-sm text-muted">{auth.session?.user.email ?? '—'}</p><p class="mt-1.5 text-xs text-muted-soft">Para cambiarlo, usa la sección Seguridad.</p></div>
			{#if message}<p class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-xs text-ember">{message}</p>{/if}
			{#if error}<p class="rounded-btn border border-error/20 bg-error/10 px-3 py-3 text-xs text-error">{error}</p>{/if}
			<div class="flex justify-end"><button onclick={saveProfile} disabled={saving} class="btn btn-3d btn-lg disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button></div>
		</div>
	</SettingsSection>

	<SettingsSection title="Resumen del plan">
		<div class="space-y-4 p-5 sm:p-8"><div><p class="text-sm font-semibold text-ink">Plan {plan.name}</p><p class="mt-0.5 text-xs text-muted">Miembro desde {auth.profile?.created_at ? new Date(auth.profile.created_at).toLocaleDateString('es-CU', { year: 'numeric', month: 'long' }) : '—'}</p></div><p class="text-sm text-body">{storesCount} tienda{storesCount === 1 ? '' : 's'} y {productsCount} producto{productsCount === 1 ? '' : 's'} en uso.</p><a href={`/dashboard/s/${$page.params.code ?? ''}/configuracion/planes`} class="text-sm font-semibold text-ember no-underline hover:underline">Ver planes y límites</a></div>
	</SettingsSection>
</section>
{#if cropFile}<ImageCropper file={cropFile} onconfirm={confirmAvatar} oncancel={() => (cropFile = null)} />{/if}
