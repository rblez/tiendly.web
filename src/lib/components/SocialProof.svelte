<script lang="ts">
	import { onMount } from 'svelte';

	const NAMES = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Camila', 'Andrés', 'Sofía', 'Miguel', 'Valentina', 'Raúl', 'Isabel', 'Héctor', 'Diana'];
	const STORES = ['Panadería El Sol', 'Dulces de la Abuela', 'Mi Moda Store', 'TechZone', 'Floristería Bella', 'Café La Esquina', 'Kiosco Online', 'Boutique Lili', 'Ferretería Max', 'Repostería Betty', 'Frutería Tropical', 'Studio Lila'];
	const VERBS = ['creó su tienda', 'recibió 2 pedidos nuevos', 'vendió 3 productos', 'publicó su catálogo', 'abrió su negocio online', 'recibió un pedido'];

	interface Toast {
		id: number;
		name: string;
		text: string;
		store: string;
		minutes: number;
	}

	let toast = $state<Toast | null>(null);
	let toastVisible = $state(false);

	let bars = $state<number[]>([]);
	let visitors = $state(0);

	function randomItem<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function nextToast(id: number): Toast {
		return {
			id,
			name: randomItem(NAMES),
			text: randomItem(VERBS),
			store: randomItem(STORES),
			minutes: 1 + Math.floor(Math.random() * 45),
		};
	}

	onMount(() => {
		bars = Array.from({ length: 18 }, () => 20 + Math.floor(Math.random() * 80));
		visitors = 2840 + Math.floor(Math.random() * 300);

		let id = 0;
		const showToast = (initial = false) => {
			toast = nextToast(++id);
			toastVisible = true;
			setTimeout(() => {
				toastVisible = false;
				if (!initial) setTimeout(showToast, 2500);
			}, 4200);
		};
		const first = setTimeout(() => showToast(true), 2500);

		const barsTimer = setInterval(() => {
			bars = bars.map((v) => Math.min(100, Math.max(15, v + Math.floor(Math.random() * 24) - 12)));
			visitors += Math.floor(Math.random() * 14) - 1;
		}, 1800);

		return () => {
			clearTimeout(first);
			clearInterval(barsTimer);
		};
	});
</script>

<div
	class="fixed left-4 bottom-4 z-[70] w-[calc(100%-2rem)] max-w-xs transition-all duration-500 ease-out"
	class:translate-y-0={toastVisible && toast}
	class:translate-y-[150%]={!toastVisible || !toast}
	aria-live="polite"
>
	{#if toast}
		<div class="flex items-center gap-3 bg-card border border-hairline rounded-card shadow-2xl p-4">
			<div class="h-10 w-10 flex items-center justify-center rounded-full bg-ember/15 text-ember font-bold flex-shrink-0">
				{toast.name.charAt(0)}
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm text-ink leading-snug">
					<span class="font-semibold">{toast.name}</span> {toast.text}
				</p>
				<p class="text-xs text-muted truncate mt-0.5">
					{toast.store} · hace {toast.minutes} min
				</p>
			</div>
			<span class="relative flex h-2 w-2 flex-shrink-0">
				<span class="absolute inline-flex h-full w-full rounded-full bg-ember opacity-60 animate-ping"></span>
				<span class="relative inline-flex rounded-full h-2 w-2 bg-ember"></span>
			</span>
		</div>
	{/if}
</div>

<div class="grid lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6 pb-20">
	<div class="bg-card border border-hairline rounded-card p-6">
		<div class="flex items-center justify-between mb-5">
			<div>
				<h3 class="font-bold text-ink">Visitas a tiendas</h3>
				<p class="text-xs text-muted mt-0.5">Usuarios explorando tiendas ahora mismo</p>
			</div>
			<span class="inline-flex items-center gap-1.5 text-xs font-medium text-ember">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full rounded-full bg-ember opacity-60 animate-ping"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-ember"></span>
				</span>
				En vivo
			</span>
		</div>
		<div class="flex items-end gap-1.5 h-40">
			{#each bars as v, i}
				<div
					class="flex-1 rounded-t-md transition-all duration-700 ease-out"
					style={`height: ${v}%; background-color: color-mix(in srgb, var(--accent) ${30 + (v / 100) * 55}%, #080808)`}
				></div>
			{/each}
		</div>
		<div class="flex items-center justify-between mt-4 pt-4 border-t border-hairline">
			<p class="text-xs text-muted">Visitando ahora</p>
			<p class="text-xl font-black text-ink tabular-nums">{visitors.toLocaleString('es-CU')}</p>
		</div>
	</div>

	<div class="flex flex-col gap-4 sm:gap-6">
		<div class="bg-card border border-hairline rounded-card p-6 flex-1 flex flex-col justify-center">
			<i class="ri-store-2-line text-2xl text-ember mb-3"></i>
			<p class="text-3xl font-black text-ink tabular-nums">2,847</p>
			<p class="text-sm text-muted mt-1">tiendas creadas esta semana</p>
		</div>
		<div class="bg-card border border-hairline rounded-card p-6 flex-1 flex flex-col justify-center">
			<i class="ri-shopping-bag-3-line text-2xl text-ember mb-3"></i>
			<p class="text-3xl font-black text-ink tabular-nums">38,120</p>
			<p class="text-sm text-muted mt-1">pedidos enviados por WhatsApp</p>
		</div>
	</div>
</div>
