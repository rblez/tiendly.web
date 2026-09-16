<script lang="ts">
	import { page } from '$app/stores';

	let storeCode = $derived($page.params.code ?? '');
	let categories = $state([
		{ name: 'Ropa', subcategories: ['Camisetas', 'Pantalones'] },
		{ name: 'Accesorios', subcategories: ['Bolsos', 'Joyas'] }
	]);
	let categoryName = $state('');
	let subcategoryName = $state('');
	let selectedCategory = $state(0);

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
	<div class="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
		<div class="rounded-card border border-hairline bg-card p-5">
			<div class="mb-4 flex items-center justify-between"><h2 class="font-semibold text-ink">Categorías</h2><span class="text-xs text-muted">{categories.length}</span></div>
			<div class="space-y-2">{#each categories as category, index}<button type="button" class="flex w-full items-center justify-between rounded-btn px-3 py-3 text-left text-sm {selectedCategory === index ? 'bg-ember/10 font-semibold text-ember' : 'text-body hover:bg-canvas'}" onclick={() => (selectedCategory = index)}><span>{category.name}</span><i class="ri-arrow-right-s-line"></i></button>{/each}</div>
			<div class="mt-5 flex gap-2"><input bind:value={categoryName} onkeydown={(event) => event.key === 'Enter' && addCategory()} class="input flex-1" placeholder="Nueva categoría" aria-label="Nueva categoría" /><button type="button" class="btn btn-3d btn-sm" onclick={addCategory}>Añadir</button></div>
		</div>
		<div class="rounded-card border border-hairline bg-card p-5"><h2 class="font-semibold text-ink">Subcategorías</h2><p class="mt-1 text-sm text-muted">{categories[selectedCategory]?.name ?? 'Selecciona una categoría'}</p>{#if categories[selectedCategory]}<div class="mt-4 flex flex-wrap gap-2">{#each categories[selectedCategory].subcategories as subcategory}<span class="rounded-full bg-canvas px-3 py-1.5 text-xs text-body">{subcategory}</span>{/each}{#if categories[selectedCategory].subcategories.length === 0}<span class="text-sm text-muted">Aún no hay subcategorías.</span>{/if}</div><div class="mt-6 flex gap-2"><input bind:value={subcategoryName} onkeydown={(event) => event.key === 'Enter' && addSubcategory()} class="input flex-1" placeholder="Nueva subcategoría" aria-label="Nueva subcategoría" /><button type="button" class="btn btn-3d btn-sm" onclick={addSubcategory}>Añadir</button></div>{/if}</div>
	</div>
</section>
