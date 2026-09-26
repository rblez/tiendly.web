<script lang="ts">
	import type { Snippet } from "svelte";

	type NavKey = "inicio" | "productos" | "pedidos" | "ajustes";

	let {
		initials,
		storeName,
		userName,
		active,
		children,
	}: {
		initials: string;
		storeName: string;
		userName: string;
		active: NavKey;
		children: Snippet;
	} = $props();

	const nav: { key: NavKey; label: string; icon: string; href: string | null }[] = [
		{ key: "inicio", label: "Inicio", icon: "ri-home-5-line", href: "/demo/panel" },
		{ key: "productos", label: "Productos", icon: "ri-box-3-line", href: null },
		{ key: "pedidos", label: "Pedidos", icon: "ri-list-ordered", href: null },
		{ key: "ajustes", label: "Ajustes", icon: "ri-settings-line", href: "/demo/panel/ajustes" },
	];
</script>

<div class="min-h-screen bg-canvas text-ink" data-panel>
	<div class="border-b border-ember/25 bg-ember/10 px-4 py-2 text-center text-xs font-medium text-ember">
		Vista previa del rediseño con datos de ejemplo — no está en producción
	</div>
	<header class="sticky top-0 z-30 border-b border-hairline bg-canvas/95 backdrop-blur-xl">
		<div class="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
			<div class="flex min-w-0 items-center gap-3">
				<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember text-sm font-black text-white" aria-hidden="true">
					{initials}
				</span>
				<div class="min-w-0">
					<p class="truncate font-semibold tracking-tight">{storeName}</p>
					<p class="hidden truncate text-[11px] text-muted sm:block">Panel de tu tienda</p>
				</div>
			</div>
			<div class="ml-auto flex items-center gap-2">
				<span class="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-card text-muted" aria-hidden="true">
					<i class="ri-notification-3-line"></i>
				</span>
				<span class="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-card px-2.5" aria-hidden="true">
					<span class="flex h-6 w-6 items-center justify-center rounded-lg bg-ember/10 text-ember">
						<i class="ri-user-line text-sm"></i>
					</span>
					<span class="hidden text-xs font-semibold sm:block">{userName}</span>
					<i class="ri-arrow-down-s-line text-muted"></i>
				</span>
			</div>
		</div>
	</header>

	<div class="min-h-[calc(100vh-9rem)] pb-24">
		{@render children()}
	</div>

	<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Navegación principal">
		<div class="mx-auto grid max-w-md grid-cols-4 gap-1">
			{#each nav as item}
				{@const isActive = item.key === active}
				{#if item.href}
					<a
						href={item.href}
						class={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium no-underline ${isActive ? "is-current" : "text-muted"}`}
						aria-current={isActive ? "page" : undefined}
					>
						<i class={`${item.icon} text-xl leading-none`} aria-hidden="true"></i>
						<span>{item.label}</span>
					</a>
				{:else}
					<span
						class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium text-muted opacity-40"
						aria-disabled="true"
						title="No incluido en esta vista previa"
					>
						<i class={`${item.icon} text-xl leading-none`} aria-hidden="true"></i>
						<span>{item.label}</span>
					</span>
				{/if}
			{/each}
		</div>
	</nav>
</div>

<style>
	.is-current {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}
</style>
