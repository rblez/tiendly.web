<script lang="ts">
 import { page } from '$app/stores';
 const code = $derived($page.params.code ?? '');
 const base = $derived(`/dashboard/s/${code}/configuracion`);
 const sections = $derived([
  { title: 'Tienda', items: [['ri-store-2-line','Información general','Nombre, usuario y descripción','informacion'],['ri-image-edit-line','Apariencia','Logo, tema y banner','apariencia'],['ri-list-check-2','Categorías','Organiza el catálogo de tu tienda','categorias'],['ri-eye-line','Visibilidad','Visible u oculta en Tiendly','visibilidad'],['ri-whatsapp-line','Contacto y modo de pedido','WhatsApp, Telegram y checkout','contacto'],['ri-share-line','Redes sociales','Canales oficiales de tu tienda','redes'],['ri-map-pin-line','Información adicional','Ubicación, horario y enlaces','adicional'],['ri-exchange-dollar-line','Moneda y tasas','USD o CUP y conversión base','moneda'],['ri-bank-card-line','Pagos','Métodos nativos y personalizados','pagos'],['ri-ticket-2-line','Cupones y descuentos','Códigos, límites y fechas','/dashboard/s/'+code+'/cupones']] },
  { title: 'Cuenta', items: [['ri-user-line','Perfil','Nombre personal, teléfono, avatar y resumen','cuenta'],['ri-shield-keyhole-line','Seguridad','Contraseña, correo, sesiones y eliminación','cuenta/seguridad']] },
 ]);
</script>
<svelte:head><title>Ajustes | Tiendly</title></svelte:head>
<div class="mx-auto min-h-full max-w-2xl px-4 pb-28 pt-7 sm:px-6">
 <div class="mb-8"><h1 class="text-3xl font-semibold tracking-tight text-ink">Ajustes</h1><p class="mt-2 text-sm text-muted">Configura cómo funciona tu tienda.</p></div>
 {#each sections as section (section.title)}
  <section class="mb-7"><h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted">{section.title}</h2><div class="overflow-hidden rounded-card border border-hairline bg-card shadow-sm">{#each section.items as item (item[3])}<a href={item[3] === 'notificaciones' ? `/dashboard/s/${code}/notificaciones` : item[3].includes('#') ? `${base}/${item[3]}` : item[3].startsWith('/') ? item[3] : `${base}/${item[3]}`} class="group flex items-center gap-4 px-4 py-4 text-ink no-underline transition-colors hover:bg-ember/5"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-ember/10 text-lg text-ember"><i class={item[0]} aria-hidden="true"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm font-medium">{item[1]}</strong><small class="mt-0.5 block truncate text-xs text-muted">{item[2]}</small></span><i class="ri-arrow-right-s-line text-lg text-muted-soft transition-transform group-hover:translate-x-0.5" aria-hidden="true"></i></a>{/each}</div></section>
 {/each}

</div>
