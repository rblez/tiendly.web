<script lang="ts">
	import { dashUi } from '$lib/stores/dash.svelte';
	import { storeUrl } from '$lib/utils';

	let {
		store,
		tab,
		unreadOrders,
		visitTotal,
		ordersCount,
		productsCount,
		productLimit,
	}: {
		store: { name: string; logo: string | null; slug: string };
		tab: string;
		unreadOrders: number;
		visitTotal: number;
		ordersCount: number;
		productsCount: number;
		productLimit: number | null;
	} = $props();

	const navItems = [
		{ key: 'resumen', label: 'Resumen' },
		{ key: 'productos', label: 'Productos' },
		{ key: 'pedidos', label: 'Pedidos' },
		{ key: 'cupones', label: 'Cupones' },
		{ key: 'apariencia', label: 'Apariencia' },
		{ key: 'configuracion', label: 'Configuración' },
	];

	function closeStoreDrawer() {
		if (window.innerWidth < 768) dashUi.setStore(false);
	}
</script>

{#snippet sidebarContent()}
	<div class="bg-card border border-hairline rounded-card p-4">
		<a href={storeUrl(store.slug)} target="_blank" class="flex items-center gap-3 no-underline group">
			{#if store.logo}
				<img src={store.logo} alt={store.name} class="h-10 w-10 rounded-xl object-cover" />
			{:else}
				<span class="h-10 w-10 rounded-xl bg-ember text-canvas font-black flex items-center justify-center text-lg">
					{(store.name || 'T').charAt(0).toUpperCase()}
				</span>
			{/if}
			<div class="min-w-0">
				<p class="font-bold text-ink truncate">{store.name}</p>
				<span class="inline-flex items-center gap-1 text-xs text-ember font-medium group-hover:underline">
					Ver tienda
					<i class="ri-external-link-line"></i>
				</span>
			</div>
		</a>
	</div>

	<nav class="bg-card border border-hairline rounded-card p-2 space-y-1">
		{#each navItems as item}
			<a
				href="?tab={item.key}"
				onclick={closeStoreDrawer}
				class="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-btn text-sm font-medium no-underline transition-colors
					{tab === item.key ? 'bg-ember text-white' : 'text-body hover:bg-ember/10 hover:text-ember'}"
			>
				{item.label}
				{#if item.key === 'pedidos' && unreadOrders > 0}
					<span
						class={`ml-auto min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full tabular-nums ${
							tab === 'pedidos' ? 'bg-white text-[#111827]' : 'bg-ember text-white'
						}`}
					>
						{unreadOrders}
					</span>
				{/if}
			</a>
		{/each}
	</nav>

	<div class="bg-card border border-hairline rounded-card divide-y divide-hairline-soft text-sm">
		<div class="px-5 py-3.5 flex items-center justify-between gap-2">
			<span class="text-muted">Visitas 7d</span>
			<span class="font-bold text-ink tabular-nums">{visitTotal}</span>
		</div>
		<div class="px-5 py-3.5 flex items-center justify-between gap-2">
			<span class="text-muted">Pedidos</span>
			<span class="font-bold text-ink tabular-nums">{ordersCount}</span>
		</div>
		<div class="px-5 py-3.5 flex items-center justify-between gap-2">
			<span class="text-muted">Productos</span>
			<span class="font-bold text-ink tabular-nums">
				{productsCount}
				{#if Number.isFinite(productLimit)}
					<span class="font-semibold text-muted-soft">/{productLimit}</span>
				{/if}
			</span>
		</div>
	</div>
{/snippet}

{#if dashUi.storeOpen}
	<aside class="hidden md:block w-[220px] shrink-0">
		{@render sidebarContent()}
	</aside>
{/if}

{#if dashUi.storeOpen}
	<button
		class="md:hidden fixed inset-0 z-40 bg-black/50 cursor-default"
		onclick={() => dashUi.setStore(false)}
		aria-label="Cerrar menú"
	></button>
	<div class="md:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-card border-r border-hairline overflow-y-auto p-4 flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<p class="text-sm font-bold text-ink">Menú</p>
			<button
				onclick={() => dashUi.setStore(false)}
				class="w-9 h-9 flex items-center justify-center rounded-btn border border-hairline bg-card hover:border-ember/50 transition-colors cursor-pointer text-ink"
				aria-label="Cerrar menú"
				title="Cerrar menú"
			>
				<i class="ri-close-line"></i>
			</button>
		</div>
		{@render sidebarContent()}
	</div>
{/if}