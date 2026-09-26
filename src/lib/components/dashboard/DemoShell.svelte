<script lang="ts">
	/* Shell del demo con reglas iOS: nav bar 44pt + safe area, blur,
	   tab bar 49pt + safe area, targets de 44pt. */
	import type { Snippet } from "svelte";
	import TIcon from "$lib/components/ios/TIcon.svelte";
	import TTabBar, { type TabItem } from "$lib/components/ios/TTabBar.svelte";

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

	const tabs: TabItem[] = [
		{ key: "inicio", label: "Inicio", icon: "home", href: "/demo/panel" },
		{ key: "productos", label: "Productos", icon: "box", href: null },
		{ key: "pedidos", label: "Pedidos", icon: "orders", href: null, badge: 3 },
		{ key: "ajustes", label: "Ajustes", icon: "sliders", href: "/demo/panel/ajustes" },
	];
</script>

<div class="tshell" data-ios>
	<div class="tshell-banner t-footnote" role="note">
		Vista previa del rediseño con datos de ejemplo — no está en producción
	</div>

	<header class="tnav" style:padding-top="env(safe-area-inset-top)">
		<div class="tnav-bar">
			<div class="tnav-id">
				<span class="tnav-avatar t-headline" aria-hidden="true">{initials}</span>
				<div class="tnav-titles">
					<p class="t-headline tnav-name">{storeName}</p>
					<p class="t-caption t-secondary">Panel de tu tienda</p>
				</div>
			</div>
			<div class="tnav-actions">
				<button type="button" class="tnav-btn t-press" aria-label="Notificaciones">
					<TIcon name="bell" size={22} />
					<span class="tnav-dot" aria-hidden="true"></span>
				</button>
				<button type="button" class="tnav-user t-press" aria-label={`Cuenta de ${userName}`}>
					<span class="tnav-user-icon" aria-hidden="true">
						<TIcon name="user" size={16} strokeWidth={2.2} />
					</span>
					<span class="t-subhead tnav-user-name">{userName}</span>
				</button>
			</div>
		</div>
	</header>

	<main class="tshell-main">
		{@render children()}
	</main>

	<TTabBar {tabs} {active} />
</div>

<style>
	.tshell {
		min-height: 100vh;
		min-height: 100dvh;
	}
	.tshell-banner {
		padding: var(--s2) var(--s4);
		text-align: center;
		font-weight: 500;
		color: var(--ios-orange);
		background: color-mix(in srgb, var(--ios-orange) 12%, transparent);
	}
	.tnav {
		position: sticky;
		top: 0;
		z-index: 30;
		background: color-mix(in srgb, var(--ios-grouped) 82%, transparent);
		backdrop-filter: blur(20px) saturate(1.6);
		-webkit-backdrop-filter: blur(20px) saturate(1.6);
		border-bottom: 1px solid var(--ios-separator);
	}
	.tnav-bar {
		display: flex;
		align-items: center;
		gap: var(--s3);
		min-height: var(--nav-h);
		padding: var(--s2) var(--s4);
	}
	.tnav-id {
		display: flex;
		align-items: center;
		gap: var(--s3);
		min-width: 0;
		flex: 1;
	}
	.tnav-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border-radius: var(--r-sm);
		background: var(--ios-tint);
		color: #fff;
	}
	.tnav-titles {
		min-width: 0;
	}
	.tnav-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tnav-actions {
		display: flex;
		align-items: center;
		gap: var(--s1);
		margin-left: auto;
	}
	.tnav-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--touch-min);
		height: var(--touch-min);
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--ios-label);
		cursor: pointer;
	}
	.tnav-dot {
		position: absolute;
		top: 10px;
		right: 12px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--ios-red);
	}
	.tnav-user {
		display: flex;
		align-items: center;
		gap: var(--s2);
		min-height: var(--touch-min);
		padding: 0 var(--s3) 0 var(--s1);
		border: 0;
		border-radius: 999px;
		background: var(--ios-fill);
		color: var(--ios-label);
		cursor: pointer;
	}
	.tnav-user-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background: var(--ios-tint);
		color: #fff;
	}
	.tnav-user-name {
		font-weight: 600;
	}
	.tshell-main {
		padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + var(--s4));
	}
</style>
