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

<div class="relative min-h-[calc(100vh-4rem)] overflow-hidden flex flex-col items-center justify-center px-4 py-16">
	<picture>
		<source srcset="/auth-bg-mobile.webp" media="(max-width: 768px)" />
		<img
			src="/auth-bg.webp"
			alt=""
			class="absolute inset-0 h-full w-full object-cover"
			fetchpriority="high"
		/>
	</picture>
	<div class="absolute inset-0 bg-black/75"></div>
	<div class="relative z-10 w-full max-w-sm fade-up" style="animation-delay: 0.05s">
		<div class="flex flex-col items-center text-center mb-7">
			<span class="h-14 w-14 flex items-center justify-center mb-4 shadow-[0_10px_30px_rgba(34,197,94,0.35)]">
						<img src="/isotipo.png" alt="Tiendly" class="h-14 w-14 object-contain" />
					</span>
		</div>
		<div class="bg-card border border-hairline rounded-2xl p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.5)] fade-up" style="animation-delay: 0.12s">
			<div class="mb-7">
				<h1 class="text-2xl sm:text-[1.7rem] font-bold text-ink tracking-tight mb-1.5">Crea tu cuenta</h1>
				<p class="text-sm text-muted">{subtitle}</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-body mb-1.5">Tu nombre</label>
					<div class="relative">
						<i class="ri-user-smile-line absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft text-lg pointer-events-none"></i>
						<input
							id="name"
							type="text"
							required
							bind:value={name}
							placeholder="Ana Pérez"
							autocomplete="name"
							class="w-full pl-10 pr-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
						/>
					</div>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-body mb-1.5">Correo</label>
					<div class="relative">
						<i class="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft text-lg pointer-events-none"></i>
						<input
							id="email"
							type="email"
							required
							bind:value={email}
							placeholder="tu@correo.com"
							autocomplete="email"
							class="w-full pl-10 pr-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
						/>
					</div>
				</div>
				<div>
					<label for="password" class="block text-sm font-medium text-body mb-1.5">Contraseña</label>
					<div class="relative">
						<i class="ri-lock-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft text-lg pointer-events-none"></i>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							required
							minlength="6"
							bind:value={password}
							placeholder="Mínimo 6 caracteres"
							autocomplete="new-password"
							class="w-full pl-10 pr-11 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
							aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
						>
							<i class={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5 flex items-start gap-2">
						<i class="ri-error-warning-line mt-0.5"></i>
						<span>{error}</span>
					</p>
				{/if}
				{#if info}
					<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-2.5 flex items-start gap-2">
						<i class="ri-information-line mt-0.5"></i>
						<span>{info}</span>
					</p>
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
					{#if !loading}
						<i class="ri-arrow-right-line"></i>
					{/if}
				</button>
				<p class="text-xs text-muted-soft text-center">Al crear tu cuenta aceptas los términos de Tiendly.</p>
			</form>
		</div>
		<p class="text-center text-sm text-white/60 mt-7 fade-up" style="animation-delay: 0.2s">
			¿Ya tienes cuenta? <a href={previewToken ? `/login?preview=${previewToken}` : '/login'} class="text-ember font-medium hover:text-ember-active no-underline">Iniciar sesión</a>
		</p>
	</div>
</div>
