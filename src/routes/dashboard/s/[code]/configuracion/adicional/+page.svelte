<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import { onMount } from 'svelte';

	let storeCode = $derived($page.params.code ?? '');
	let storeId = $state('');
	let location = $state('');
	let schedule = $state('');
	let links = $state<{ title: string; url: string }[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state('');
	let error = $state('');
	let initial = $state('');

	onMount(async () => {
		const { data } = await supabase.from('stores').select('id, location, schedule, extra_links').eq('code', storeCode).maybeSingle();
		if (!data) { error = 'No se encontró la tienda.'; loading = false; return; }
		storeId = (data as any).id;
		location = (data as any).location ?? '';
		schedule = (data as any).schedule ?? '';
		const raw = (data as any).extra_links;
		links = Array.isArray(raw) ? raw.filter((l: unknown): l is { title: string; url: string } => !!l && typeof l === 'object' && typeof (l as any).url === 'string') : [];
		initial = JSON.stringify({ location, schedule, links });
		loading = false;
	});

	let dirty = $derived(JSON.stringify({ location, schedule, links }) !== initial);

	function addLink() { links = [...links, { title: '', url: '' }]; }
	function removeLink(i: number) { links = links.filter((_, li) => li !== i); }

	async function save() {
		saving = true; error = ''; msg = '';
		const cleanLinks = links
			.map((l) => ({ title: l.title.trim(), url: l.url.trim() }))
			.filter((l) => l.url);
		const payload = { location: location.trim() || null, schedule: schedule.trim() || null, extra_links: cleanLinks };
		const { error: err } = await supabase.from('stores').update(payload).eq('id', storeId);
		saving = false;
		if (err) { error = err.message; return; }
		links = cleanLinks;
		initial = JSON.stringify({ location: payload.location ?? '', schedule: payload.schedule ?? '', links });
		msg = 'Guardado.';
		setTimeout(() => (msg = ''), 2000);
	}
</script>

<svelte:head><title>Información adicional | Tiendly</title></svelte:head>

{#if loading}
	<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
	<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
		<div class="bg-card border border-hairline rounded-card p-5 space-y-4">
			<div>
				<label for="s-loc" class="block text-sm font-medium text-body mb-1.5">Ubicación</label>
				<input id="s-loc" type="text" bind:value={location} placeholder="Ej: Centro Habana, La Habana" class="input w-full" />
				<p class="text-xs text-muted-soft mt-1">Se muestra en tu página de tienda.</p>
			</div>
			<div>
				<label for="s-sched" class="block text-sm font-medium text-body mb-1.5">Horario</label>
				<input id="s-sched" type="text" bind:value={schedule} placeholder="Ej: Lun–Sáb, 9:00 am – 6:00 pm" class="input w-full" />
			</div>
			<div>
				<div class="flex items-center justify-between mb-1.5">
					<p class="block text-sm font-medium text-body">Enlaces extra</p>
					<button type="button" onclick={addLink} class="text-xs font-semibold text-ember hover:underline cursor-pointer">+ Agregar enlace</button>
				</div>
				<p class="text-xs text-muted-soft mb-3">Menús PDF, catálogos, tu web, lo que quieras.</p>
				{#if links.length > 0}
					<div class="space-y-2">
						{#each links as link, i (i)}
							<div class="rounded-btn border border-hairline bg-canvas p-3">
								<div class="flex items-center justify-between gap-3 pb-2">
									<span class="text-xs font-semibold text-muted-soft">Enlace {i + 1}</span>
									<button type="button" onclick={() => removeLink(i)} class="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer" aria-label={`Quitar enlace ${i + 1}`}>
										<i class="ri-close-line" aria-hidden="true"></i>
									</button>
								</div>
								<div class="space-y-3">
									<div>
										<label for={`s-link-title-${i}`} class="mb-1.5 block text-xs font-medium text-body">Título</label>
										<input id={`s-link-title-${i}`} type="text" bind:value={link.title} placeholder="Ej: Ver menú" class="input input-sm w-full" />
									</div>
									<div>
										<label for={`s-link-url-${i}`} class="mb-1.5 block text-xs font-medium text-body">URL</label>
										<input id={`s-link-url-${i}`} type="url" bind:value={link.url} placeholder="https://ejemplo.com" class="input input-sm w-full" inputmode="url" autocomplete="url" />
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<button type="button" onclick={addLink} class="w-full px-3 py-2.5 bg-bone border border-dashed border-hairline rounded-btn text-sm text-muted hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
						+ Agregar un enlace
					</button>
				{/if}
			</div>
		</div>

		{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
		{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}

		<button onclick={save} disabled={!dirty || saving} class="btn btn-3d btn-md w-full disabled:opacity-50">
			{saving ? 'Guardando...' : 'Guardar cambios'}
		</button>
	</div>
{/if}
