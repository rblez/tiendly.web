<script lang="ts">
 import { page } from '$app/stores';
 import { auth } from '$lib/stores/auth.svelte';
 const code = $derived($page.params.code ?? '');
 const items = [['ri-user-3-line','Perfil','Foto, nombre y teléfono','perfil'],['ri-vip-crown-line','Plan y límites','Tu plan y capacidad','general'],['ri-lock-password-line','Seguridad','Contraseña, correo y sesiones','seguridad'],['ri-shield-check-line','Privacidad','Sesiones y eliminación de cuenta','privacidad']];
</script>
<svelte:head><title>Cuenta | Tiendly</title></svelte:head>
<div class="mx-auto min-h-full max-w-2xl px-4 pb-10 pt-5 sm:px-6">
 <header class="mb-8 flex items-center gap-3"><a href={`/dashboard/s/${code}/configuracion`} aria-label="Volver a Ajustes" class="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-card text-ink no-underline"><i class="ri-arrow-left-line text-lg"></i></a><h1 class="text-xl font-semibold text-ink">Cuenta</h1></header>
 <div class="mb-8 flex items-center gap-4 rounded-card border border-hairline bg-card p-5"><div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ember/10 text-xl font-bold text-ember">{#if auth.profile?.avatar_url}<img src={auth.profile.avatar_url} alt="Avatar" class="h-full w-full object-cover" />{:else}{(auth.profile?.name || 'T').charAt(0).toUpperCase()}{/if}</div><div class="min-w-0"><p class="truncate font-semibold text-ink">{auth.profile?.name || 'Mi cuenta'}</p><p class="truncate text-sm text-muted">{auth.session?.user.email || ''}</p></div></div>
 <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted">Preferencias</p><div class="overflow-hidden rounded-card border border-hairline bg-card">{#each items as item (item[3])}<a href={`/dashboard/s/${code}/configuracion/cuenta/${item[3]}`} class="group flex items-center gap-4 px-4 py-4 text-ink no-underline transition-colors hover:bg-ember/5"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-ember/10 text-lg text-ember"><i class={item[0]} aria-hidden="true"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm font-medium">{item[1]}</strong><small class="mt-0.5 block text-xs text-muted">{item[2]}</small></span><i class="ri-arrow-right-s-line text-lg text-muted-soft" aria-hidden="true"></i></a>{/each}</div>
</div>
