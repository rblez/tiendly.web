<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { STORE_CATEGORIES } from '$lib/categories';

	let storeCode = $derived($page.params.code ?? '');
	let categories = $state(STORE_CATEGORIES.map(({ name }) => ({ name, subcategories: [] as string[] })));
	let loading = $state(true);
	let loadError = $state('');
	let categoryName = $state('');
	let subcategoryName = $state('');
	let selectedCategory = $state(0);

	onMount(async () => {
		const { data: store } = await supabase.from('stores').select('id').eq('code', storeCode).maybeSingle();
		if (!store) {
			loadError = 'No se encontró la tienda.';
			loading = false;
			return;
		}

		const { data, error } = await supabase.from('products').select('category').eq('store_id', store.id).not('category', 'is', null);
		if (error) {
			loadError = 'No se pudieron cargar las categorías oficiales.';
		} else {
			const usedNames = new Set((data ?? []).map((product) => product.category?.trim()).filter(Boolean));
			categories = STORE_CATEGORIES.filter(({ name }) => usedNames.has(name)).map(({ name }) => ({ name, subcategories: [] }));
			if (categories.length === 0) categories = STORE_CATEGORIES.map(({ name }) => ({ name, subcategories: [] }));
		}
		loading = false;
	});

	function addCategory() {
		const name = categoryName.trim();
		if (!name) return;
		categories = [...categories, { name, subcategories: [] }];
		categoryName = '';
		selectedCategory = categories.length - 1;
	}

	function addSubcategory() {
		const name = subcategoryName.trim();
		if (!name || !categories[selectedCategory]) return;
		categories = categories.map((category, index) => index === selectedCategory ? { ...category, subcategories: [...category.subcategories, name] } : category);
		subcategoryName = '';
	}
</script>

<section class="mx-auto max-w-3xl px-4 pb-10 pt-9 sm:px-6 sm:pt-12">
	<div class="mb-7"><h1 class="text-2xl font-bold text-ink sm:text-3xl">Categorías</h1><p class="mt-1 text-sm text-muted">Organiza tus productos con categorías y subcategorías.</p></div>
	{#if loadError}<p class="mb-4 rounded-btn border border-error/20 bg-error/10 px-3 py-3 text-sm text-error">{loadError}</p>{/if}
	<div class="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
		<div class="rounded-card border border-hairline bg-card p-5">
			<div class="mb-4 flex items-center justify-between"><h2 class="font-semibold text-ink">Categorías</h2><span class="text-xs text-muted">{loading ? 'Cargando…' : categories.length}</span></div>
			<div class="space-y-2">{#each categories as category, index}<button type="button" class="flex w-full items-center justify-between rounded-btn px-3 py-3 text-left text-sm {selectedCategory === index ? 'bg-ember/10 font-semibold text-ember' : 'text-body hover:bg-canvas'}" onclick={() => (selectedCategory = index)}><span>{category.name}</span><i class="ri-arrow-right-s-line"></i></button>{/each}</div>
			<div class="mt-5 flex gap-2"><input bind:value={categoryName} onkeydown={(event) => event.key === 'Enter' && addCategory()} class="input flex-1" placeholder="Nueva categoría" aria-label="Nueva categoría" /><button type="button" class="btn btn-3d btn-sm" onclick={addCategory}>Añadir</button></div>
		</div>
		<div class="rounded-card border border-hairline bg-card p-5"><h2 class="font-semibold text-ink">Subcategorías</h2><p class="mt-1 text-sm text-muted">{categories[selectedCategory]?.name ?? 'Selecciona una categoría'}</p>{#if categories[selectedCategory]}<div class="mt-4 flex flex-wrap gap-2">{#each categories[selectedCategory].subcategories as subcategory}<span class="rounded-full bg-canvas px-3 py-1.5 text-xs text-body">{subcategory}</span>{/each}{#if categories[selectedCategory].subcategories.length === 0}<span class="text-sm text-muted">Aún no hay subcategorías.</span>{/if}</div><div class="mt-6 flex gap-2"><input bind:value={subcategoryName} onkeydown={(event) => event.key === 'Enter' && addSubcategory()} class="input flex-1" placeholder="Nueva subcategoría" aria-label="Nueva subcategoría" /><button type="button" class="btn btn-3d btn-sm" onclick={addSubcategory}>Añadir</button></div>{/if}</div>
	</div>
</section>
