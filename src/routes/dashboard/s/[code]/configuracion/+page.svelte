<script lang="ts">
 import { page } from '$app/stores';
 import { auth } from '$lib/stores/auth.svelte';
 const code = $derived($page.params.code ?? '');
 const base = $derived(`/dashboard/s/${code}/configuracion`);
 const sections = [
  { title: 'Tienda', items: [['ri-store-2-line','Información general','Nombre, usuario y descripción','informacion'],['ri-image-edit-line','Apariencia','Logo y color de tu tienda','apariencia'],['ri-eye-line','Visibilidad','Visible u oculta en Tiendly','visibilidad'],['ri-share-forward-line','Compartir tienda','URL pública, copiar y compartir','compartir']] },
  { title: 'Comunicación', items: [['ri-whatsapp-line','Contacto','WhatsApp y recepción de pedidos','contacto'],['ri-share-line','Redes sociales','Conecta tus perfiles','redes'],['ri-map-pin-line','Información adicional','Ubicación, horario y enlaces','adicional']] },
  { title: 'Ventas', items: [['ri-exchange-dollar-line','Moneda','CUP y USD · dos tasas editables','moneda'],['ri-bank-card-line','Pagos','Métodos de cobro','pagos']] },
  { title: 'Cuenta', items: [['ri-vip-crown-line','Planes','Compara Gratis y Pro','planes'],['ri-user-line','Perfil','Nombre, teléfono y avatar','cuenta'],['ri-shield-keyhole-line','Seguridad','Contraseña y acceso','cuenta/seguridad'],['ri-notification-3-line','Notificaciones','Pedidos y avisos','notificaciones']] },
 ];
</script>
<svelte:head><title>Ajustes | Tiendly</title></svelte:head>
<div class="mx-auto min-h-full max-w-2xl px-4 pb-28 pt-7 sm:px-6">
 <div class="mb-8"><p class="mb-2 text-xs font-semibold uppercase tracking-widest text-ember">Tienda</p><h1 class="text-3xl font-semibold tracking-tight text-ink">Ajustes</h1><p class="mt-2 text-sm text-muted">Configura cómo funciona tu tienda.</p><button type="button" class="mt-4 text-sm font-semibold text-ember hover:underline" onclick={() => document.dispatchEvent(new CustomEvent('tiendly:restart-tour'))}>Ver tutorial de nuevo</button></div>
 {#each sections as section (section.title)}
  <section class="mb-7"><h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted">{section.title}</h2><div class="overflow-hidden rounded-card border border-hairline bg-card shadow-sm">{#each section.items as item (item[3])}<a data-tour={item[3] === 'moneda' ? 'rates' : item[3] === 'pagos' ? 'payments' : item[3] === 'compartir' ? 'share' : undefined} href={item[3] === 'notificaciones' ? `/dashboard/s/${code}/notificaciones` : item[3].startsWith('/') ? item[3] : `${base}/${item[3]}`} class="group flex items-center gap-4 px-4 py-4 text-ink no-underline transition-colors hover:bg-ember/5"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-ember/10 text-lg text-ember"><i class={item[0]} aria-hidden="true"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm font-medium">{item[1]}</strong><small class="mt-0.5 block truncate text-xs text-muted">{item[2]}</small></span><i class="ri-arrow-right-s-line text-lg text-muted-soft transition-transform group-hover:translate-x-0.5" aria-hidden="true"></i></a>{/each}</div></section>
 {/each}
 <button type="button" onclick={() => auth.signOut()} class="flex w-full items-center justify-center gap-2 rounded-card border border-error/20 bg-error/5 px-4 py-4 text-sm font-semibold text-error transition-colors hover:bg-error/10"><i class="ri-logout-box-r-line" aria-hidden="true"></i>Cerrar sesión</button>
</div>
