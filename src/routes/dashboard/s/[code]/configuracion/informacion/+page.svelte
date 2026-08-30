<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import { slugify } from '$lib/utils';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { STORE_CATEGORIES } from '$lib/categories';
	import { onMount } from 'svelte';

	let storeCode = $derived($page.params.code ?? '');
	let storeId = $state('');
	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let category = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state('');
	let error = $state('');
	let initial = $state('');

	function normalizeSlug(value: string) {
		return slugify(value.replace(/^@+/, ''));
	}

	function onSlugInput() {
		slug = normalizeSlug(slug);
	}

	onMount(async () => {
		const { data } = await supabase.from('stores').select('*').eq('code', storeCode).maybeSingle();
		if (!data) { error = 'No se encontró la tienda.'; loading=false; return; }
		storeId = (data as any).id;
		name = (data as any).name ?? '';
		slug = normalizeSlug((data as any).slug ?? '');
		description = (data as any).description ?? '';
		category = (data as any).category ?? '';
		initial = JSON.stringify({ name, slug, description, category });
		loading=false;
	});

	let dirty = $derived(JSON.stringify({ name, slug, description, category }) !== initial);

	async function save() {
		if (!storeId) return;
		saving=true; error=''; msg='';
		const payload = { name: name.trim(), slug: slugify(slug), description: description.trim() || null, category: category || null };
		if (!payload.name) { error='El nombre es obligatorio.'; saving=false; return; }
		if (!payload.slug) { error='El usuario es obligatorio.'; saving=false; return; }
		const { error: err } = await supabase.from('stores').update(payload).eq('id', storeId);
		saving=false;
		if (err) { error = err.message; return; }
		initial = JSON.stringify({ name: payload.name, slug: payload.slug, description: payload.description ?? '', category: payload.category ?? '' });
		msg='Guardado.';
		setTimeout(()=>msg='',2000);
	}
</script>

<svelte:head><title>Información general | Tiendly</title></svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

{#if loading}
	<div class="flex items-center justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
	<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
		<div class="bg-card border border-hairline rounded-card p-5 space-y-4">
			<div>
				<label for="s-name" class="block text-sm font-medium text-body mb-1.5">Nombre</label>
				<input id="s-name" type="text" bind:value={name} class="input w-full" />
			</div>
			<div>
				<label for="s-slug" class="block text-sm font-medium text-body mb-1.5">Usuario</label>
				<div class="flex overflow-hidden rounded-btn border border-hairline bg-canvas transition-colors focus-within:border-ember focus-within:ring-2 focus-within:ring-ember/20">
					<span class="flex items-center border-r border-hairline px-3 text-sm font-semibold text-muted-soft" aria-hidden="true">@</span>
					<input id="s-slug" type="text" bind:value={slug} oninput={onSlugInput} class="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-ink outline-none" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="s-slug-preview" />
				</div>
				<p id="s-slug-preview" class="mt-2 text-xs text-muted-soft">Tu tienda: <span class="font-medium text-body">tiendly.lat/@{slug || 'usuario'}</span></p>
			</div>
			<div>
				<label for="s-desc" class="block text-sm font-medium text-body mb-1.5">Descripción</label>
				<textarea id="s-desc" bind:value={description} rows="2" class="input w-full resize-none"></textarea>
			</div>
			<div>
				<p class="block text-sm font-medium text-body mb-1.5">Categoría</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
					{#each STORE_CATEGORIES as c (c.name)}
						<label class="flex items-center gap-2.5 border border-hairline rounded-btn px-3.5 py-2.5 cursor-pointer hover:border-ember/50 {category===c.name?'border-ember/60 bg-ember/5':''}">
							<input type="radio" name="cat" value={c.name} checked={category===c.name} onchange={()=>category=c.name} class="w-4 h-4 accent-ember" />
							<span class="text-sm text-ink">{c.name}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
		{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
		{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}
		<button onclick={save} disabled={!dirty || saving} class="btn btn-3d btn-md w-full disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
	</div>
{/if}
