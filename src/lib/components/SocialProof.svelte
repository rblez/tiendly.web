<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';

	let storesCount = $state(0);
	let ordersCount = $state(0);
	let productsCount = $state(0);

	onMount(() => {
		(async () => {
			try {
				const [{ count: stores }, { count: orders }, { count: products }] = await Promise.all([
					supabase.from('stores').select('id', { count: 'exact', head: true }).eq('active', true),
					supabase.from('orders').select('id', { count: 'exact', head: true }),
					supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
				]);
				storesCount = stores ?? 0;
				ordersCount = orders ?? 0;
				productsCount = products ?? 0;
			} catch {
				// estadísticas no disponibles
			}
		})();
	});
</script>

<div class="grid sm:grid-cols-3 gap-4 sm:gap-6 pb-20">
	<div class="bg-card border border-hairline rounded-card p-6">
		<i class="ri-store-2-line text-2xl text-ember mb-3"></i>
		<p class="text-3xl font-black text-ink tabular-nums">{storesCount.toLocaleString('es-CU')}</p>
		<p class="text-sm text-muted mt-1">tiendas creadas en Tiendly</p>
	</div>
	<div class="bg-card border border-hairline rounded-card p-6">
		<i class="ri-shopping-bag-line text-2xl text-ember mb-3"></i>
		<p class="text-3xl font-black text-ink tabular-nums">{productsCount.toLocaleString('es-CU')}</p>
		<p class="text-sm text-muted mt-1">productos publicados</p>
	</div>
	<div class="bg-card border border-hairline rounded-card p-6">
		<i class="ri-whatsapp-line text-2xl text-ember mb-3"></i>
		<p class="text-3xl font-black text-ink tabular-nums">{ordersCount.toLocaleString('es-CU')}</p>
		<p class="text-sm text-muted mt-1">pedidos enviados por WhatsApp</p>
	</div>
</div>
