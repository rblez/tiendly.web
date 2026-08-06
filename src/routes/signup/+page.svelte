<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let params = $derived(new URLSearchParams($page.url.search));
	let previewToken = $derived(params.get('preview') ?? '');
	let storeName = $derived(params.get('name') ?? '');
	let subtitle = $derived(
		previewToken
			? `Tu tienda «${storeName || 'sin nombre'}» te espera. Crea tu cuenta para activarla.`
			: 'Gratis, sin tarjeta. Tu tienda lista en 5 minutos.'
	);
	let name = $state(storeName);
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let info = $state('');
	let loading = $state(false);
	let claiming = $state(false);
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
			claiming = true;
			const storeCode = await claimPreview();
			claiming = false;
			if (storeCode) {
				goto(`/dash/store/${storeCode}?created=1`);
				return;
			}
		}
		goto('/dash');
	}

	$effect(() => {
		if (previewToken && !claimed) {
			// vuelta del flujo OAuth: la sesión ya existe, reclamar directo
			supabase.auth.getSession().then(({ data }) => {
				if (data.session && !claimed) afterAuth();
			});
		}
	});

	async function signInWithGoogle() {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${location.origin}/signup?preview=${previewToken}&name=${encodeURIComponent(storeName)}`,
			},
		});
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		info = '';
		loading = true;
		const { data, error: err } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { name } },
		});
		loading = false;
		if (err) {
			error = friendlyAuthError(err.message);
			return;
		}
		if (data.session) {
			await afterAuth();
		} else {
			info = 'Revisa tu correo para confirmar la cuenta, luego inicia sesión para activar tu tienda.';
		}
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
</script>

<svelte:head>
	<title>Crear cuenta | Tiendly</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm">
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h1 class="text-xl font-bold text-ink mb-1">Crea tu cuenta</h1>
			<p class="text-sm text-muted mb-6">{subtitle}</p>

			<button
				type="button"
				onclick={signInWithGoogle}
				disabled={claiming}
				class="w-full inline-flex items-center justify-center gap-2.5 bg-card border border-hairline text-ink px-5 py-2.5 rounded-btn text-sm font-semibold hover:border-ember/50 hover:text-ember transition-colors cursor-pointer disabled:opacity-50 mb-3"
			>
				<i class="ri-google-line text-base"></i>
				Continuar con Google
			</button>
			<div class="flex items-center gap-3 mb-4">
				<div class="flex-1 h-px bg-hairline"></div>
				<span class="text-[11px] text-muted-soft">o con correo</span>
				<div class="flex-1 h-px bg-hairline"></div>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-body mb-1.5">Tu nombre</label>
					<input
						id="name"
						type="text"
						required
						bind:value={name}
						placeholder="Ana Pérez"
						autocomplete="name"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
					/>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="tu@correo.com"
						autocomplete="email"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
					/>
				</div>
				<div>
					<label for="password" class="block text-sm font-medium text-body mb-1.5">Contraseña</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							required
							minlength="6"
							bind:value={password}
							placeholder="Mínimo 6 caracteres"
							autocomplete="new-password"
							class="w-full px-3.5 py-2.5 pr-11 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
							aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
						>
							<i class={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{error}</p>
				{/if}
				{#if info}
					<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-2.5">{info}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<i class="ri-loader-4-line animate-spin"></i>
					{/if}
					{loading ? 'Creando cuenta...' : 'Crear cuenta'}
				</button>
				<p class="text-xs text-muted-soft text-center">Al crear tu cuenta aceptas los términos de Tiendly.</p>
			</form>
		</div>
		<p class="text-center text-sm text-muted mt-6">
			¿Ya tienes cuenta? <a href={previewToken ? `/login?preview=${previewToken}` : '/login'} class="text-ember hover:text-ember-active no-underline">Iniciar sesión</a>
		</p>
	</div>
</div>
