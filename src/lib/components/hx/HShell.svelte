<script lang="ts">
	/* Shell estilo Telegram/Xiaomi: app bar con título grande + acciones,
	   navegación inferior en píldora flotante, banner de vista previa. */
	import type { Snippet } from "svelte";
	import HIcon from "./HIcon.svelte";

	export type HTab = {
		key: string;
		label: string;
		icon: string;
		href: string | null;
		badge?: number;
	};

	let {
		title,
		active,
		children,
	}: {
		title: string;
		active: string;
		children: Snippet;
	} = $props();

	const tabs: HTab[] = [
		{ key: "inicio", label: "Inicio", icon: "home", href: "/demo/panel" },
		{ key: "productos", label: "Productos", icon: "box", href: null },
		{ key: "pedidos", label: "Pedidos", icon: "orders", href: null, badge: 3 },
		{ key: "ajustes", label: "Ajustes", icon: "sliders", href: "/demo/panel/ajustes" },
	];
</script>

<div class="hshell" data-hyper>
	<div class="hshell-banner" role="note">
		Vista previa del rediseño con datos de ejemplo — no está en producción
	</div>

	<header class="happbar" style:padding-top="env(safe-area-inset-top)">
		<h1 class="happbar-title">{title}</h1>
		<div class="happbar-actions">
			<button type="button" class="happbar-btn hx-press" aria-label="Buscar">
				<HIcon name="search" size={24} />
			</button>
			<button type="button" class="happbar-btn hx-press" aria-label="Notificaciones">
				<HIcon name="bell" size={24} />
				<span class="happbar-dot" aria-hidden="true"></span>
			</button>
		</div>
	</header>

	<main class="hshell-main">
		{@render children()}
	</main>

	<nav
		class="hnavbar"
		aria-label="Navegación principal"
		style:bottom="calc(1rem + env(safe-area-inset-bottom))"
	>
		{#each tabs as tab (tab.key)}
			{@const isActive = tab.key === active}
			{#if tab.href}
				<a
					href={tab.href}
					class="htab hx-press"
					class:is-active={isActive}
					aria-current={isActive ? "page" : undefined}
					aria-label={tab.badge ? `${tab.label}, ${tab.badge} pendientes` : tab.label}
				>
					<span class="htab-pill">
						<HIcon name={tab.icon} size={24} strokeWidth={isActive ? 2.2 : 2} />
						{#if tab.badge}
							<span class="htab-badge">{tab.badge > 99 ? "99+" : tab.badge}</span>
						{/if}
					</span>
					<span class="htab-label">{tab.label}</span>
				</a>
			{:else}
				<span class="htab is-disabled" aria-disabled="true" title="No incluido en esta vista previa">
					<span class="htab-pill"><HIcon name={tab.icon} size={24} /></span>
					<span class="htab-label">{tab.label}</span>
				</span>
			{/if}
		{/each}
	</nav>
</div>

<style>
	.hshell {
		min-height: 100vh;
		min-height: 100dvh;
	}
	.hshell-banner {
		padding: 0.5rem 1rem;
		text-align: center;
		font-size: var(--hx-t-sub);
		font-weight: 500;
		color: var(--hx-accent);
		background: color-mix(in srgb, var(--hx-accent) 12%, transparent);
	}
	.happbar {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: var(--hx-appbar-h);
		padding: 0.5rem 0.5rem 0.5rem 1.25rem;
		background: var(--hx-bar);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
	}
	.happbar-title {
		flex: 1;
		min-width: 0;
		font-size: var(--hx-t-appbar);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.happbar-actions {
		display: flex;
		align-items: center;
	}
	.happbar-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--hx-text-2);
		cursor: pointer;
	}
	.happbar-dot {
		position: absolute;
		top: 0.75rem;
		right: 0.875rem;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--hx-accent);
	}
	.hshell-main {
		padding: 1rem 0.75rem calc(var(--hx-nav-h) + env(safe-area-inset-bottom) + 2rem);
		max-width: 44rem;
		margin-inline: auto;
	}
	.hnavbar {
		position: fixed;
		left: 1rem;
		right: 1rem;
		z-index: 40;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		max-width: 32rem;
		margin-inline: auto;
		min-height: var(--hx-nav-h);
		padding: 0.375rem;
		background: var(--hx-bar);
		border-radius: 1.75rem;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.35),
			0 0 0 1px var(--hx-divider);
	}
	.htab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		padding: 0.375rem 0.25rem;
		border-radius: 1.25rem;
		color: var(--hx-text-2);
		text-decoration: none;
	}
	.htab.is-disabled {
		opacity: 0.4;
	}
	.htab-pill {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 3.5rem;
		height: 2rem;
		padding-inline: 1rem;
		border-radius: var(--hx-r-pill);
		transition: background var(--hx-dur) var(--hx-ease);
	}
	.htab.is-active .htab-pill {
		background: color-mix(in srgb, var(--hx-accent) 20%, transparent);
		color: var(--hx-accent);
	}
	.htab-label {
		font-size: var(--hx-t-tab);
		font-weight: 500;
	}
	.htab.is-active .htab-label {
		color: var(--hx-accent);
		font-weight: 600;
	}
	.htab-badge {
		position: absolute;
		top: -2px;
		right: 6px;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 0.3125rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--hx-r-pill);
		background: #ef4444;
		color: #fff;
		font-size: 0.6875rem;
		font-weight: 700;
	}
</style>
