<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { uploadImage } from '$lib/utils';
	import { PLAN_MAP } from '$lib/plans';
	import { supabase } from '$lib/supabase/client';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import { onMount } from 'svelte';

	type Prefs = { sound: boolean; browser: boolean; badge: boolean };

	const PREFS_KEY = 'tiendly-notif-prefs';

	const TABS = ['perfil', 'general', 'privacidad'] as const;
	type ProfileTab = (typeof TABS)[number];

	let prefs = $state<Prefs>({ sound: true, browser: true, badge: true });

	let storesCount = $state(0);
	let productsCount = $state(0);

	onMount(() => {
		try {
			const raw = localStorage.getItem(PREFS_KEY);
			if (raw) prefs = { sound: true, browser: true, badge: true, ...JSON.parse(raw) };
		} catch {
			/* prefs por defecto */
		}
		loadUsage();
	});

	async function loadUsage() {
		if (!auth.session) return;
		const { data: st } = await supabase.from('stores').select('id').eq('owner_id', auth.session.user.id);
		storesCount = st?.length ?? 0;
		const ids = (st ?? []).map((r) => r.id);
		if (ids.length > 0) {
			const { data: pr } = await supabase.from('products').select('store_id').in('store_id', ids);
			productsCount = pr?.length ?? 0;
		}
	}

	function savePrefs() {
		try {
			localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
		} catch {
			/* sin storage */
		}
	}

	function pathTab(): ProfileTab | null {
		const seg = $page.url.pathname.split('/').filter(Boolean).pop() ?? '';
		if ((TABS as readonly string[]).includes(seg)) return seg as ProfileTab;
		return null;
	}

	function urlTab(fallback: ProfileTab): ProfileTab {
		const p = pathTab();
		if (p) return p;
		const t = $page.url.searchParams.get('tab');
		return typeof t === 'string' && (TABS as readonly string[]).includes(t) ? (t as ProfileTab) : fallback;
	}

	let tab = $derived(urlTab('perfil'));

	$effect(() => {
		const t = $page.url.searchParams.get('tab');
		if (t && (TABS as readonly string[]).includes(t)) {
			goto(`/dashboard/s/${$page.params.code ?? ''}/configuracion/cuenta/${t}`, { replaceState: true });
		}
	});

	// ---------- Pestaña Perfil ----------
	let name = $state('');
	let phone = $state('');
	let uploading = $state(false);
	let profileMsg = $state('');
	let saving = $state(false);
	let profileError = $state('');
	let cropFile = $state<File | null>(null);

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
		cropFile = file;
		input.value = '';
	}

	async function confirmAvatar(file: File) {
		cropFile = null;
		if (!auth.session) return;
		uploading = true;
		profileError = '';
		try {
			const url = await uploadImage(file, "logo");
			await auth.updateProfile({ avatar_url: url });
		} catch {
			profileError = 'No se pudo subir la foto. Intenta con otra imagen.';
		} finally {
			uploading = false;
		}
	}

	function removeAvatar() {
		auth.updateProfile({ avatar_url: null });
	}

	async function saveProfile() {
		if (saving) return;
		profileError = '';
		profileMsg = '';
		saving = true;
		try {
			await auth.updateProfile({ name: name.trim(), phone: phone.trim() || null });
			profileMsg = 'Perfil actualizado.';
		} catch {
			profileError = 'No se pudo guardar el perfil.';
		}
		saving = false;
	}

	// ---------- Pestaña Ajustes ----------
	let password = $state('');
	let newEmail = $state('');
	let secMsg = $state('');
	let secError = $state('');
	let secBusy = $state(false);

	async function changePassword() {
		secError = '';
		secMsg = '';
		if (password.length < 6) {
			secError = 'La contraseña debe tener al menos 6 caracteres.';
			return;
		}
		secBusy = true;
		const { error } = await supabase.auth.updateUser({ password });
		secBusy = false;
		if (error) {
			secError = error.message;
			return;
		}
		password = '';
		secMsg = 'Contraseña actualizada. La próxima vez inicia sesión con ella.';
	}

	async function changeEmail() {
		secError = '';
		secMsg = '';
		if (!newEmail.includes('@')) {
			secError = 'Ingresa un correo válido.';
			return;
		}
		secBusy = true;
		const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
		secBusy = false;
		if (error) {
			secError = error.message;
			return;
		}
		newEmail = '';
		secMsg = 'Te enviamos un correo para confirmar el cambio. Revisa tu bandeja de entrada.';
	}

	async function signOutOthers() {
		secBusy = true;
		await supabase.auth.signOut({ scope: 'others' });
		secBusy = false;
		secMsg = 'Sesiones cerradas en los demás dispositivos.';
	}

	// ---------- Pestaña Privacidad ----------
	let deleteConfirm = $state(false);
	let deleting = $state(false);
	let privError = $state('');
	let loggingOut = $state(false);

	async function signOut() {
		if (loggingOut) return;
		loggingOut = true;
		await auth.signOut();
		goto('/');
	}

	async function deleteAccount() {
		if (!deleteConfirm || !auth.session) return;
		deleting = true;
		privError = '';
		try {
			const { error } = await supabase.rpc('delete_account', { p_user_id: auth.session.user.id });
			if (error) throw error;
			await auth.signOut();
			goto('/');
		} catch {
			privError = 'No se pudo eliminar la cuenta. Intenta de nuevo.';
			deleting = false;
		}
	}

	function setPref(key: keyof Prefs) {
		prefs[key] = !prefs[key];
		savePrefs();
	}

	const plan = $derived(PLAN_MAP[auth.plan] ?? PLAN_MAP.free);
</script>

{#snippet toggleRow(label: string, desc: string, key: keyof Prefs)}
	<button
		onclick={() => setPref(key)}
		class="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
	>
		<div>
			<p class="text-sm font-medium text-ink">{label}</p>
			<p class="text-xs text-muted mt-0.5">{desc}</p>
		</div>
		<span class={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${prefs[key] ? 'bg-ember' : 'bg-bone border border-hairline'}`}>
			<span class={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-5.5' : 'translate-x-1'}`}></span>
		</span>
	</button>
{/snippet}

<svelte:head>
	<title>Perfil | Tiendly</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 pb-7 sm:pb-10">
		<div class="mb-8 pt-1">
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (history.length > 1 ? history.back() : goto(`/dashboard/s/${$page.params.code ?? ''}/configuracion`))}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-muted transition-colors hover:bg-bone hover:text-ink"
					aria-label="Volver"
				>
					<i class="ri-arrow-left-line text-xl" aria-hidden="true"></i>
				</button>
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold text-ink">Perfil</h1>
					<p class="text-sm text-muted mt-1">Tu cuenta y preferencias en Tiendly</p>
				</div>
			</div>
		</div>

	<div class="mt-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-5 lg:items-start">
		<div class="min-w-0">

	{#if tab === 'perfil'}
		<SettingsSection title="Perfil">
		<div class="p-5 sm:p-8 space-y-8">
			<div class="flex items-center gap-5">
				<div class="h-16 w-16 flex-shrink-0 rounded-full overflow-hidden bg-canvas border border-hairline flex items-center justify-center">
					{#if auth.profile?.avatar_url}
						<img src={auth.profile.avatar_url} alt="Foto de perfil" class="w-full h-full object-cover" />
					{:else}
						<span class="text-2xl font-black text-ember">
							{name ? name.charAt(0).toUpperCase() : 'T'}
							</span>
						{/if}
					</div>
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<label class="btn btn-3d btn-sm cursor-pointer" title={auth.profile?.avatar_url ? 'Cambiar foto' : 'Subir foto'}>
								{#if uploading}<i class="ri-loader-4-line animate-spin"></i>{:else}<i class="ri-camera-line"></i>{/if}
								{uploading ? 'Subiendo...' : auth.profile?.avatar_url ? 'Cambiar' : 'Subir'}
								<input type="file" accept="image/*" class="hidden" onchange={handleAvatar} />
							</label>
							{#if auth.profile?.avatar_url}<button onclick={removeAvatar} class="inline-flex items-center gap-1 text-xs text-muted-soft hover:text-error transition-colors cursor-pointer" title="Quitar foto"><i class="ri-delete-bin-6-line"></i>Quitar</button>{/if}
						</div>
						<p class="text-xs text-muted-soft">Foto opcional. Aparecerá junto a tu cuenta.</p>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="p-name" class="block text-sm font-medium text-body mb-1.5">Nombre</label>
					<input
						id="p-name"
						type="text"
						bind:value={name}
						placeholder="Tu nombre"
						class="input"
					/>
				</div>
				<div>
					<label for="p-phone" class="block text-sm font-medium text-body mb-1.5">Teléfono <span class="text-muted-soft">(opcional)</span></label>
					<input
						id="p-phone"
						type="tel"
						bind:value={phone}
						placeholder="Ej: +53 5 1234567"
						class="input"
					/>
				</div>
			</div>

			<div>
				<label for="p-email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
				<input
					id="p-email"
					type="email"
					value={auth.session?.user.email ?? ''}
					disabled
					class="input cursor-not-allowed"
				/>
				<p class="text-xs text-muted-soft mt-1.5">El correo es tu identificador de cuenta. Para cambiarlo usa la pestaña General.</p>
			</div>

			<div class="bg-canvas/70 border border-hairline rounded-card p-5">
				<div class="flex items-center justify-between gap-3 mb-4">
					<div>
						<p class="text-sm font-semibold text-ink">Plan {plan.name}</p>
						<p class="text-xs text-muted mt-0.5">
							Miembro desde {auth.profile?.created_at ? new Date(auth.profile.created_at).toLocaleDateString('es-CU', { year: 'numeric', month: 'long' }) : '—'}
						</p>
					</div>
				</div>
				<div class="space-y-3">
					<div>
						<div class="flex items-center justify-between text-xs mb-1">
							<span class="text-muted">Tiendas</span>
							<span class="font-semibold text-ink tabular-nums">{storesCount} de {plan.limitStores}</span>
						</div>
						<div class="h-1.5 bg-bone rounded-full overflow-hidden">
							<div class="h-full bg-ember rounded-full transition-all" style="width:{Math.min(100, (storesCount / plan.limitStores) * 100)}%"></div>
						</div>
					</div>
					<div>
						<div class="flex items-center justify-between text-xs mb-1">
							<span class="text-muted">Productos</span>
							{#if Number.isFinite(plan.limitProducts)}
								<span class="font-semibold text-ink tabular-nums">{productsCount} de {plan.limitProducts * plan.limitStores}</span>
							{:else}
								<span class="font-semibold text-ink">Ilimitados</span>
	{/if}

						</div>
						<div class="h-1.5 bg-bone rounded-full overflow-hidden">
							<div class="h-full bg-ember rounded-full transition-all" style="width:{Math.min(100, (productsCount / (Number.isFinite(plan.limitProducts) ? plan.limitProducts * plan.limitStores : 1)) * 100)}%"></div>
						</div>
					</div>
				</div>
			</div>

			{#if profileError}
				<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{profileError}</p>
			{/if}
			{#if profileMsg}
				<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{profileMsg}</p>
			{/if}

			<div class="flex justify-end">
				<button
					onclick={saveProfile}
					disabled={saving}
					class="btn btn-3d btn-lg disabled:opacity-50"
				>
					{#if saving}
						<i class="ri-loader-4-line animate-spin"></i>
					{/if}
					Guardar cambios
				</button>
			</div>
			</div>
		</SettingsSection>
		{:else if tab === 'general'}
			<SettingsSection title="General">
			<div class="space-y-8 p-5 sm:p-8">
			<h2 class="font-bold text-ink mb-1">Notificaciones de pedidos</h2>
			<p class="text-sm text-muted mb-5">Se aplican al panel de tu tienda cuando llega un pedido nuevo.</p>
			<div class="space-y-5">
				{@render toggleRow('Sonido', 'Reproducir un aviso sonoro con cada pedido', 'sound')}
				{@render toggleRow('Notificación del navegador', 'Mostrar una notificación del sistema con el pedido', 'browser')}
				{@render toggleRow('Contador en la pestaña', 'Mostrar el número de pedidos sin leer en el título de la pestaña', 'badge')}
			</div>
		</div>

		<div class="space-y-8 mt-6">
			<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
				<h2 class="font-bold text-ink mb-1">Cambiar contraseña</h2>
				<p class="text-sm text-muted mb-5">Usa al menos 6 caracteres.</p>
				<label for="a-password" class="block text-sm font-medium text-body mb-1.5">Nueva contraseña</label>
				<div class="flex flex-col sm:flex-row gap-3">
					<input
						id="a-password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						class="input flex-1"
					/>
					<button
						onclick={changePassword}
						disabled={secBusy || !password}
						class="btn btn-3d btn-md flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Actualizar contraseña
					</button>
				</div>
			</div>

			<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
				<h2 class="font-bold text-ink mb-1">Cambiar correo</h2>
				<p class="text-sm text-muted mb-5">Te enviaremos un correo de confirmación al nuevo email.</p>
				<label for="a-email" class="block text-sm font-medium text-body mb-1.5">Nuevo correo</label>
				<div class="flex flex-col sm:flex-row gap-3">
					<input
						id="a-email"
						type="email"
						bind:value={newEmail}
						placeholder="nuevo@correo.com"
						class="input flex-1"
					/>
					<button
						onclick={changeEmail}
						disabled={secBusy || !newEmail}
						class="btn btn-3d btn-md flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Actualizar correo
					</button>
				</div>
			</div>

			<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
				<h2 class="font-bold text-ink mb-1">Sesiones</h2>
				<p class="text-sm text-muted mb-5">Cierra el acceso a tu cuenta en otros dispositivos. Tu sesión actual se mantiene.</p>
				<button
					onclick={signOutOthers}
					disabled={secBusy}
					class="btn btn-secondary btn-md disabled:opacity-40"
				>
					Cerrar sesión en otros dispositivos
				</button>
			</div>

			{#if secError}
				<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{secError}</p>
			{/if}
			{#if secMsg}
				<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{secMsg}</p>
			{/if}
			</div>
			</SettingsSection>
		{:else}
			<SettingsSection title="Privacidad">
			<div class="space-y-8 p-5 sm:p-8">
			<div class="bg-card border border-error/30 rounded-card p-6 sm:p-8">
				<h2 class="font-bold text-error mb-1">Eliminar cuenta</h2>
				<p class="text-sm text-body mb-4">
					Se borrarán tu perfil, todas tus tiendas, productos, pedidos y estadísticas. Esta acción no se puede deshacer.
				</p>
				<label class="flex items-start gap-2.5 mb-5 cursor-pointer">
					<input type="checkbox" bind:checked={deleteConfirm} class="mt-0.5 accent-ember cursor-pointer" />
					<span class="text-sm text-body">Entiendo que esto eliminará mi cuenta y toda mi información permanentemente.</span>
				</label>
				{#if privError}
					<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3 mb-4">{privError}</p>
				{/if}
				<button
					onclick={deleteAccount}
					disabled={!deleteConfirm || deleting}
					class="inline-flex items-center bg-error text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
				</button>
			</div>

			<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
				<h2 class="font-bold text-ink mb-1">Cerrar sesión</h2>
				<p class="text-sm text-body mb-4">Cierra tu sesión actual en este dispositivo.</p>
				<button
					onclick={signOut}
					disabled={loggingOut}
					class="inline-flex items-center gap-2 px-5 py-3 rounded-btn border border-error text-error font-medium hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-50"
				>
					<i class="ri-logout-box-r-line"></i>
					{loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
				</button>
				</div>
			</div>
			</SettingsSection>
		{/if}
	</div>
</div>
	</section>
	{#if cropFile}
		<ImageCropper file={cropFile} onconfirm={confirmAvatar} oncancel={() => (cropFile = null)} />
	{/if}

