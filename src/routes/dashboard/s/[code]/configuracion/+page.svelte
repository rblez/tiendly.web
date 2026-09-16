<script lang="ts">
 import { page } from '$app/stores';
 import { auth } from '$lib/stores/auth.svelte';
 import { buildInfo, formatBuildDate } from '$lib/build-info';
 const code = $derived($page.params.code ?? '');
 const base = $derived(`/dashboard/s/${code}/configuracion`);
 const sections = $derived([
  { title: 'Tienda', items: [['ri-store-2-line','Información general','Nombre, usuario y descripción','informacion'],['ri-image-edit-line','Apariencia','Logo, tema y banner','apariencia'],['ri-list-check-2','Categorías','Organiza el catálogo de tu tienda','informacion#categorias'],['ri-eye-line','Visibilidad','Visible u oculta en Tiendly','visibilidad'],['ri-share-forward-line','Compartir tienda','URL pública, copiar y compartir','compartir'],['ri-whatsapp-line','Contacto y modo de pedido','WhatsApp, Telegram y checkout','contacto'],['ri-share-line','Redes sociales','Canales oficiales de tu tienda','redes'],['ri-map-pin-line','Información adicional','Ubicación, horario y enlaces','adicional'],['ri-exchange-dollar-line','Moneda y tasas','USD o CUP y conversión base','moneda'],['ri-bank-card-line','Pagos','Métodos nativos y personalizados','pagos'],['ri-ticket-2-line','Cupones y descuentos','Códigos, límites y fechas','/dashboard/s/'+code+'/cupones']] },
  { title: 'Próximamente', items: [['ri-plug-line','Integraciones','elToque, CambioCUP, Webhook, API y MCP','/dashboard/s/'+code+'/configuracion/integraciones']] },
  { title: 'Cuenta', items: [['ri-user-line','Perfil','Nombre personal, teléfono, avatar y resumen','cuenta'],['ri-shield-keyhole-line','Seguridad','Contraseña, correo, sesiones y eliminación','cuenta/seguridad'],['ri-notification-3-line','Notificaciones','Pedidos y avisos','notificaciones'],['ri-vip-crown-line','Planes','Comparación, límites y cambio de plan','planes']] },
 ]);
</script>
<svelte:head><title>Ajustes | Tiendly</title></svelte:head>
<div class="mx-auto min-h-full max-w-2xl px-4 pb-28 pt-7 sm:px-6">
 <div class="mb-8"><p class="mb-2 text-xs font-semibold uppercase tracking-widest text-ember">Tienda</p><h1 class="text-3xl font-semibold tracking-tight text-ink">Ajustes</h1><p class="mt-2 text-sm text-muted">Configura cómo funciona tu tienda.</p></div>
 {#each sections as section (section.title)}
  <section class="mb-7"><h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted">{section.title}</h2><div class="overflow-hidden rounded-card border border-hairline bg-card shadow-sm">{#each section.items as item (item[3])}<a href={item[3] === 'notificaciones' ? `/dashboard/s/${code}/notificaciones` : item[3].includes('#') ? `${base}/${item[3]}` : item[3].startsWith('/') ? item[3] : `${base}/${item[3]}`} class="group flex items-center gap-4 px-4 py-4 text-ink no-underline transition-colors hover:bg-ember/5"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-ember/10 text-lg text-ember"><i class={item[0]} aria-hidden="true"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm font-medium">{item[1]}</strong><small class="mt-0.5 block truncate text-xs text-muted">{item[2]}</small></span><i class="ri-arrow-right-s-line text-lg text-muted-soft transition-transform group-hover:translate-x-0.5" aria-hidden="true"></i></a>{/each}</div></section>
 {/each}
 <section aria-labelledby="build-info-title" class="mb-5 rounded-card border border-hairline bg-card p-4 shadow-sm sm:p-5">
  <div class="flex items-start gap-3">
   <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-ember/10 text-lg text-ember"><i class="ri-git-commit-line" aria-hidden="true"></i></span>
   <div class="min-w-0 flex-1">
    <div class="flex flex-wrap items-center gap-2">
     <h2 id="build-info-title" class="text-sm font-semibold text-ink">Información de la versión</h2>
     <span class="rounded-full bg-ember/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ember">Build activa</span>
    </div>
    <p class="mt-1 text-xs leading-relaxed text-muted">Identifica exactamente qué versión está instalada y de qué commit proviene este entorno.</p>
   </div>
  </div>
  <dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hairline pt-4 sm:grid-cols-4">
   <div><dt class="text-[10px] font-semibold uppercase tracking-wider text-muted">Versión</dt><dd class="mt-1 font-mono text-xs font-medium text-ink">v{buildInfo.version}</dd></div>
   <div><dt class="text-[10px] font-semibold uppercase tracking-wider text-muted">Commit</dt><dd class="mt-1 truncate font-mono text-xs font-medium text-ink" title={buildInfo.commitSha}>{buildInfo.shortCommitSha}</dd></div>
   <div><dt class="text-[10px] font-semibold uppercase tracking-wider text-muted">Rama</dt><dd class="mt-1 truncate font-mono text-xs font-medium text-ink">{buildInfo.branch}</dd></div>
   <div><dt class="text-[10px] font-semibold uppercase tracking-wider text-muted">Build ID</dt><dd class="mt-1 truncate font-mono text-xs font-medium text-ink" title={buildInfo.deploymentId}>{buildInfo.deploymentId}</dd></div>
  </dl>
  <div class="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3 text-[11px] text-muted">
   <span>Construida: {formatBuildDate(buildInfo.buildTimestamp)}</span>
   <span class="inline-flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-success"></span>Entorno {buildInfo.branch === 'local' ? 'local' : 'publicado'}</span>
  </div>
 </section>
 <button type="button" onclick={() => auth.signOut()} class="flex w-full items-center justify-center gap-2 rounded-card border border-error/20 bg-error/5 px-4 py-4 text-sm font-semibold text-error transition-colors hover:bg-error/10"><i class="ri-logout-box-r-line" aria-hidden="true"></i>Cerrar sesión</button>
</div>
