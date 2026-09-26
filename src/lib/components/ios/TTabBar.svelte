<script lang="ts">
	/* Tab bar iOS: 49pt + safe area, blur, máx. 5 tabs, icono 24pt + caption 10pt. */
	import TIcon from "./TIcon.svelte";

	export type TabItem = {
		key: string;
		label: string;
		icon: string;
		href: string | null;
		badge?: number;
	};

	let { tabs, active }: { tabs: TabItem[]; active: string } = $props();
</script>

<nav
	class="ttabbar"
	aria-label="Navegación principal"
	style:padding-bottom="max(0.5rem, env(safe-area-inset-bottom))"
>
	{#each tabs as tab (tab.key)}
		{@const isActive = tab.key === active}
		{#if tab.href}
			<a
				href={tab.href}
				class="ttab t-press"
				class:is-active={isActive}
				aria-current={isActive ? "page" : undefined}
				aria-label={tab.badge ? `${tab.label}, ${tab.badge} pendientes` : tab.label}
			>
				<span class="ttab-icon">
					<TIcon name={tab.icon} size={24} strokeWidth={isActive ? 2.2 : 1.8} />
					{#if tab.badge}
						<span class="ttab-badge">{tab.badge > 99 ? "99+" : tab.badge}</span>
					{/if}
				</span>
				<span class="ttab-label">{tab.label}</span>
			</a>
		{:else}
			<span
				class="ttab is-disabled"
				aria-disabled="true"
				title="No incluido en esta vista previa"
			>
				<span class="ttab-icon"><TIcon name={tab.icon} size={24} strokeWidth={1.8} /></span>
				<span class="ttab-label">{tab.label}</span>
			</span>
		{/if}
	{/each}
</nav>

<style>
	.ttabbar {
		position: fixed;
		inset-inline: 0;
		bottom: 0;
		z-index: 40;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		max-width: 34rem;
		margin-inline: auto;
		padding-top: var(--s2);
		padding-inline: var(--s2);
		background: color-mix(in srgb, var(--ios-grouped) 82%, transparent);
		backdrop-filter: blur(20px) saturate(1.6);
		-webkit-backdrop-filter: blur(20px) saturate(1.6);
		border-top: 1px solid var(--ios-separator);
	}
	.ttab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		min-height: var(--tabbar-h);
		padding: var(--s1) var(--s2);
		color: var(--ios-gray);
		text-decoration: none;
		border: 0;
		background: transparent;
		font: inherit;
	}
	.ttab.is-active {
		color: var(--ios-tint);
	}
	.ttab.is-disabled {
		opacity: 0.4;
	}
	.ttab-icon {
		position: relative;
		display: flex;
	}
	.ttab-label {
		font-size: var(--t-caption2);
		line-height: 1;
		font-weight: 500;
	}
	.ttab.is-active .ttab-label {
		font-weight: 600;
	}
	.ttab-badge {
		position: absolute;
		top: -6px;
		right: -10px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: var(--ios-red);
		color: #fff;
		font-size: 11px;
		font-weight: 700;
		line-height: 1;
	}
</style>
