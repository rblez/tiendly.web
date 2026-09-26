<script lang="ts">
	/* Fila estilo Telegram/Xiaomi: tile de color 42dp con icono blanco,
	   título + subtítulo, detalle a la derecha, chevron, divisor con inset. */
	import type { Snippet } from "svelte";
	import HIcon from "./HIcon.svelte";

	const TINTS: Record<string, string> = {
		blue: "#3b82f6",
		green: "#22c55e",
		red: "#ef4444",
		orange: "#f59e0b",
		yellow: "#eab308",
		teal: "#14b8a6",
		purple: "#a855f7",
		pink: "#ec4899",
		indigo: "#6366f1",
		gray: "#6b7280",
	};

	let {
		icon,
		tint = "gray",
		title,
		subtitle,
		detail,
		badge,
		chevron = false,
		href,
		onclick,
		suffix,
		destructive = false,
		disabled = false,
		label,
	}: {
		icon?: string;
		tint?: string;
		title: string;
		subtitle?: string;
		detail?: string;
		badge?: string;
		chevron?: boolean;
		href?: string;
		onclick?: () => void;
		suffix?: Snippet;
		destructive?: boolean;
		disabled?: boolean;
		label?: string;
	} = $props();

	const tileBg = $derived(TINTS[tint] ?? tint);
	const interactive = $derived(Boolean(href ?? onclick) && !disabled);
</script>

{#snippet body()}
	{#if icon}
		<span class="hrow-tile" style:background={tileBg} aria-hidden="true">
			<HIcon name={icon} size={22} strokeWidth={2} />
		</span>
	{/if}
	<span class="hrow-texts">
		<span class="hrow-title" class:is-destructive={destructive}>{title}</span>
		{#if subtitle}
			<span class="hrow-subtitle hx-t2">{subtitle}</span>
		{/if}
	</span>
	{#if badge}
		<span class="hrow-badge">{badge}</span>
	{:else if detail}
		<span class="hrow-detail hx-t2">{detail}</span>
	{/if}
	{#if suffix}
		<span class="hrow-suffix">{@render suffix()}</span>
	{/if}
	{#if chevron}
		<span class="hrow-chevron" aria-hidden="true">
			<HIcon name="chevronRight" size={22} strokeWidth={2.2} />
		</span>
	{/if}
{/snippet}

<div class="hrow-wrap">
	<div class="hrow-divider" class:with-icon={Boolean(icon)} aria-hidden="true"></div>
	{#if href && !disabled}
		<a {href} class="hrow hx-press" class:is-interactive={interactive} aria-label={label ?? title}>
			{@render body()}
		</a>
	{:else}
		<button
			type="button"
			class="hrow hx-press"
			class:is-interactive={interactive}
			onclick={interactive ? onclick : undefined}
			{disabled}
			aria-disabled={disabled || undefined}
			aria-label={label ?? title}
		>
			{@render body()}
		</button>
	{/if}
</div>

<style>
	.hrow-divider {
		height: 1px;
		background: var(--hx-divider);
		margin-left: 1rem;
	}
	.hrow-divider.with-icon {
		margin-left: calc(1rem + var(--hx-tile) + 0.875rem);
	}
	.hrow-wrap:first-child .hrow-divider {
		display: none;
	}
	.hrow {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		width: 100%;
		min-height: var(--hx-row-min);
		padding: 0.625rem 1rem;
		background: transparent;
		border: 0;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
	}
	.hrow.is-interactive {
		cursor: pointer;
	}
	.hrow:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.hrow-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--hx-tile);
		height: var(--hx-tile);
		border-radius: var(--hx-r-tile);
		color: #fff;
		flex-shrink: 0;
		box-shadow: var(--hx-tile-shadow);
	}
	.hrow-texts {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
		gap: 2px;
	}
	.hrow-title {
		font-size: var(--hx-t-title);
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.hrow-title.is-destructive {
		color: var(--hx-accent);
	}
	.hrow-subtitle {
		font-size: var(--hx-t-sub);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.hrow-detail {
		flex-shrink: 0;
		max-width: 38%;
		font-size: 0.9375rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.hrow-badge {
		flex-shrink: 0;
		padding: 0.1875rem 0.625rem;
		border-radius: var(--hx-r-pill);
		background: var(--hx-accent);
		color: var(--hx-accent-ink);
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.hrow-suffix {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.hrow-chevron {
		display: flex;
		color: var(--hx-text-3);
		flex-shrink: 0;
	}
</style>
