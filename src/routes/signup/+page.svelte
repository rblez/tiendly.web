<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/Logo.svelte';
	import { loadDraft, clearDraft, createStoreFromDraft } from '$lib/storeDraft';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let info = $state('');
	let loading = $state(false);

	async function afterAuth(userId: string) {
		const draft = loadDraft();
		if (draft) {
			clearDraft();
			try {
				const storeId = await createStoreFromDraft(draft, userId);
				goto(`/app/store/${storeId}?created=1`);
				return;
			} catch (e) {
				console.error('No se pudo crear la tienda desde el borrador', e);
			}
		}
		goto('/app');
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
			error = err.message;
			return;
		}
		if (data.session) {
			await afterAuth(data.session.user.id);
		} else {
			info = 'Revisa tu correo para confirmar la cuenta, luego inicia sesión.';
		}
	}
</script>

<svelte:head>
	<title>Crear cuenta | Tiendly</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
	<div class="w-full max-w-sm">
		<div class="flex justify-center mb-8">
			<Logo size="h-12" />
		</div>
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h1 class="text-xl font-bold text-ink mb-1">Crea tu cuenta</h1>
			<p class="text-sm text-muted mb-6">Gratis, sin tarjeta. Tu tienda lista en 5 minutos.</p>

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
					class="w-full bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Creando cuenta...' : 'Crear cuenta'}
				</button>
				<p class="text-xs text-muted-soft text-center">Al crear tu cuenta aceptas los términos de Tiendly.</p>
			</form>
		</div>
		<p class="text-center text-sm text-muted mt-6">
			¿Ya tienes cuenta? <a href="/login" class="text-ember hover:text-ember-active no-underline">Iniciar sesión</a>
		</p>
	</div>
</div>
