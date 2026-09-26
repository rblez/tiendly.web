<script lang="ts">
	import { formatPrice } from "$lib/utils";

	export type PanelStatus = "nuevo" | "enviado" | "completado" | "cancelado";
	export type PanelTask = { label: string; cta: string };
	export type PanelOrder = {
		code: string;
		customer: string;
		items: number;
		total: number;
		currency: string;
		status: PanelStatus;
		when: string;
	};
	export type PanelData = {
		storeName: string;
		storeInitials: string;
		revenue: number;
		revenueCurrency: string;
		revenueDelta: number;
		revenueSpark: number[];
		ordersCount: number;
		ordersDelta: number;
		visits: number;
		visitsDelta: number;
		conversion: number;
		conversionDelta: number;
		avgTicket: number;
		setupPct: number;
		nextTask: PanelTask;
		visitsSeries: { label: string; value: number }[];
		ordersSeries: { label: string; value: number }[];
		recentOrders: PanelOrder[];
		sources: { label: string; visits: number }[];
		socials: { label: string; icon: string; count: number }[];
	};

	let { data }: { data: PanelData } = $props();

	let chartTab = $state<"visitas" | "pedidos">("visitas");
	const series = $derived(chartTab === "visitas" ? data.visitsSeries : data.ordersSeries);
	const seriesMax = $derived(Math.max(1, ...series.map((d) => d.value)));
	const seriesTotal = $derived(series.reduce((s, d) => s + d.value, 0));
	const sparkMax = $derived(Math.max(1, ...data.revenueSpark));

	const STATUS_PILL: Record<PanelStatus, { label: string; cls: string }> = {
		nuevo: { label: "Nuevo", cls: "bg-ember/15 text-ember" },
		enviado: { label: "Enviado", cls: "bg-blue-500/15 text-blue-600" },
		completado: { label: "Completado", cls: "bg-success/15 text-success" },
		cancelado: { label: "Cancelado", cls: "bg-error/15 text-error" },
	};

	function deltaLabel(v: number, suffix = "%"): string {
		const sign = v > 0 ? "+" : v < 0 ? "−" : "";
		return `${sign}${Math.abs(v).toLocaleString("es-CU", { maximumFractionDigits: 1 })}${suffix}`;
	}
</script>

{#snippet deltaPill(value: number, suffix = "%")}
	<span
		class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
			value > 0 ? "bg-success/15 text-success" : value < 0 ? "bg-error/15 text-error" : "bg-bone text-muted"
		}`}
		aria-label={`Variación ${deltaLabel(value, suffix)} respecto a los 7 días anteriores`}
	>
		<i class={value >= 0 ? "ri-arrow-up-line" : "ri-arrow-down-line"} aria-hidden="true"></i>
		{deltaLabel(value, suffix)}
	</span>
{/snippet}

<div class="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
	<!-- Encabezado semántico: una sola pregunta dominante -->
	<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Inicio</h1>
			<p class="mt-1 text-sm text-muted">Últimos 7 días · {data.storeName}</p>
		</div>
		<span class="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
			<span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true"></span>
			Tienda activa
		</span>
	</div>

	<!-- Métrica estrella: responde "¿cómo va mi tienda?" en <2s -->
	<section aria-labelledby="hero-title" class="mb-4 rounded-card border border-hairline bg-card p-5 sm:p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="min-w-0">
				<h2 id="hero-title" class="text-xs font-semibold uppercase tracking-wider text-muted">Ingresos · 7 días</h2>
				<p class="mt-2 text-4xl font-black tracking-tight text-ink tabular-nums sm:text-5xl">
					{formatPrice(data.revenue, data.revenueCurrency)}
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					{@render deltaPill(data.revenueDelta)}
					<span class="text-xs text-muted">vs. 7 días anteriores</span>
				</div>
				<p class="mt-3 text-sm text-muted">
					<span class="font-semibold text-body tabular-nums">{data.ordersCount} pedidos</span>
					<span aria-hidden="true"> · </span>
					ticket promedio <span class="font-semibold text-body tabular-nums">{formatPrice(data.avgTicket, data.revenueCurrency)}</span>
				</p>
			</div>
			<div class="flex h-16 items-end gap-1 sm:h-20" role="img" aria-label="Tendencia de ingresos de los últimos 7 días">
				{#each data.revenueSpark as v}
					<div
						class="w-3 rounded-sm bg-ember/80 sm:w-4"
						style={`height:${Math.max(8, (v / sparkMax) * 100)}%`}
					></div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Métricas secundarias -->
	<section aria-label="Resumen de actividad" class="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
		<div class="rounded-card border border-hairline bg-card p-3.5 sm:p-5">
			<p class="text-[11px] font-medium uppercase tracking-wider text-muted sm:text-xs">Pedidos</p>
			<p class="mt-1.5 text-xl font-black text-ink tabular-nums sm:text-3xl">{data.ordersCount}</p>
			<div class="mt-2">{@render deltaPill(data.ordersDelta)}</div>
		</div>
		<div class="rounded-card border border-hairline bg-card p-3.5 sm:p-5">
			<p class="text-[11px] font-medium uppercase tracking-wider text-muted sm:text-xs">Visitas</p>
			<p class="mt-1.5 text-xl font-black text-ink tabular-nums sm:text-3xl">{data.visits.toLocaleString("es-CU")}</p>
			<div class="mt-2">{@render deltaPill(data.visitsDelta)}</div>
		</div>
		<div class="rounded-card border border-hairline bg-card p-3.5 sm:p-5">
			<p class="text-[11px] font-medium uppercase tracking-wider text-muted sm:text-xs">Conversión</p>
			<p class="mt-1.5 text-xl font-black text-ink tabular-nums sm:text-3xl">{data.conversion.toLocaleString("es-CU", { maximumFractionDigits: 1 })}%</p>
			<div class="mt-2">{@render deltaPill(data.conversionDelta, "pp")}</div>
		</div>
	</section>

	<!-- Próximo paso: el checklist antes invisible, ahora accionable -->
	<section aria-labelledby="next-step-title" class="mb-4 rounded-card border border-ember/25 bg-ember/[0.07] p-5 sm:p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between gap-3">
					<h2 id="next-step-title" class="text-sm font-semibold text-ink">Próximo paso</h2>
					<span class="text-xs font-bold text-ember tabular-nums">{data.setupPct}% listo</span>
				</div>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-ember/15" role="progressbar" aria-valuenow={data.setupPct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de configuración de la tienda">
					<div class="h-full rounded-full bg-ember transition-all" style={`width:${data.setupPct}%`}></div>
				</div>
				<p class="mt-3 text-sm text-body">{data.nextTask.label}</p>
			</div>
			<button type="button" class="btn btn-3d btn-md shrink-0">
				{data.nextTask.cta}
			</button>
		</div>
	</section>

	<!-- Actividad: una sola tarjeta con tabs en vez de 4 compitiendo -->
	<section aria-labelledby="activity-title" class="mb-4 rounded-card border border-hairline bg-card p-4 sm:p-6">
		<div class="mb-4 flex items-center justify-between gap-3">
			<h2 id="activity-title" class="text-sm font-semibold text-ink">Actividad</h2>
			<div class="flex rounded-full border border-hairline bg-canvas p-0.5" role="tablist" aria-label="Tipo de actividad">
				<button
					type="button"
					role="tab"
					aria-selected={chartTab === "visitas"}
					onclick={() => (chartTab = "visitas")}
					class={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${chartTab === "visitas" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}
				>
					Visitas
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={chartTab === "pedidos"}
					onclick={() => (chartTab = "pedidos")}
					class={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${chartTab === "pedidos" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}
				>
					Pedidos
				</button>
			</div>
		</div>
		<p class="mb-3 text-sm text-muted">
			<span class="text-lg font-black text-ink tabular-nums">{seriesTotal.toLocaleString("es-CU")}</span>
			{chartTab === "visitas" ? "visitas" : "pedidos"} en 7 días
		</p>
		<div class="flex h-36 items-end gap-2 sm:h-44 sm:gap-3" role="img" aria-label={`Gráfica de ${chartTab} por día`}>
			{#each series as day}
				<div class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
					<span class="text-[10px] font-semibold text-muted tabular-nums">{day.value > 0 ? day.value : ""}</span>
					<div class="flex w-full flex-1 items-end overflow-hidden rounded-t-lg bg-bone">
						<div
							class={`w-full rounded-t-lg transition-all duration-500 ${chartTab === "visitas" ? "bg-ember/80" : "bg-success/80"}`}
							style={`height:${Math.max(3, (day.value / seriesMax) * 100)}%`}
						></div>
					</div>
					<span class="text-[10px] text-muted">{day.label}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Pedidos recientes: el pulso en vivo del negocio -->
	<section aria-labelledby="recent-orders-title" class="mb-4 rounded-card border border-hairline bg-card p-4 sm:p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 id="recent-orders-title" class="flex items-center gap-2 text-sm font-semibold text-ink">
				Pedidos recientes
				<span class="inline-flex items-center gap-1.5 text-xs font-normal text-muted">
					<span class="relative flex h-1.5 w-1.5" aria-hidden="true">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-60"></span>
						<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember"></span>
					</span>
					En vivo
				</span>
			</h2>
			<span class="text-xs font-semibold text-ember">Ver todos</span>
		</div>
		<ul class="divide-y divide-hairline-soft">
			{#each data.recentOrders as o}
				{@const pill = STATUS_PILL[o.status]}
				<li class="flex items-center gap-3 py-3">
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bone text-xs font-bold text-body" aria-hidden="true">
						{o.customer.charAt(0)}
					</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold text-ink">{o.customer}</p>
						<p class="truncate text-xs text-muted tabular-nums">#{o.code} · {o.items} artículo{o.items === 1 ? "" : "s"} · {o.when}</p>
					</div>
					<div class="flex shrink-0 flex-col items-end gap-1">
						<span class="text-sm font-bold text-ink tabular-nums">{formatPrice(o.total, o.currency)}</span>
						<span class={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill.cls}`}>{pill.label}</span>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Canales: detalle progresivo, no protagonista -->
	<div class="grid gap-4 sm:grid-cols-2">
		<section aria-labelledby="sources-title" class="rounded-card border border-hairline bg-card p-4 sm:p-5">
			<div class="mb-3 flex items-center justify-between">
				<h2 id="sources-title" class="text-sm font-semibold text-ink">Fuentes de visitas</h2>
			</div>
			<ul class="grid gap-2.5">
				{#each data.sources as s}
					{@const max = Math.max(1, ...data.sources.map((x) => x.visits))}
					<li class="flex items-center gap-2.5">
						<span class="w-20 shrink-0 truncate text-xs text-body">{s.label}</span>
						<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-bone" role="img" aria-label={`${s.label}: ${s.visits} visitas`}>
							<div class="h-full rounded-full bg-ember/70" style={`width:${Math.max(4, (s.visits / max) * 100)}%`}></div>
						</div>
						<span class="w-8 shrink-0 text-right text-xs font-bold text-ink tabular-nums">{s.visits}</span>
					</li>
				{/each}
			</ul>
		</section>
		<section aria-labelledby="social-title" class="rounded-card border border-hairline bg-card p-4 sm:p-5">
			<div class="mb-3 flex items-center justify-between">
				<h2 id="social-title" class="text-sm font-semibold text-ink">Redes sociales</h2>
			</div>
			<ul class="grid gap-2.5">
				{#each data.socials as s}
					{@const max = Math.max(1, ...data.socials.map((x) => x.count))}
					<li class="flex items-center gap-2.5">
						<i class={`${s.icon} text-sm text-muted`} aria-hidden="true"></i>
						<span class="w-20 shrink-0 truncate text-xs text-body">{s.label}</span>
						<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-bone" role="img" aria-label={`${s.label}: ${s.count} clics`}>
							<div class="h-full rounded-full bg-ember/70" style={`width:${Math.max(4, (s.count / max) * 100)}%`}></div>
						</div>
						<span class="w-8 shrink-0 text-right text-xs font-bold text-ink tabular-nums">{s.count}</span>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</div>
