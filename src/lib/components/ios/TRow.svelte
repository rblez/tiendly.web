<script lang="ts">
	/* Fila de tabla agrupada iOS: altura mínima 44pt, icono 29pt estilo Ajustes,
	   separador con inset tras el icono, chevron de detalle. Accesible. */
	import type { Snippet } from "svelte";
	import TIcon from "./TIcon.svelte";

	/* Tiles sólidos estilo Ajustes de iOS */
	const TINTS: Record<string, string> = {
		blue: "var(--ios-blue)",
		green: "var(--ios-tint)",
		red: "var(--ios-red)",
		orange: "var(--ios-orange)",
		yellow: "var(--ios-yellow)",
		teal: "var(--ios-teal)",
		purple: "var(--ios-purple)",
		pink: "var(--ios-pink)",
		indigo: "var(--ios-indigo)",
		gray: "var(--ios-gray)",
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
		<span class="trow-tile" style:background={tileBg} aria-hidden="true">
			<TIcon name={icon} size={19} strokeWidth={2.2} />
		</span>
	{/if}
	<span class="trow-texts">
		<span class="trow-title t-body" class:t-destructive={destructive}>{title}</span>
		{#if subtitle}
			<span class="trow-subtitle t-footnote t-secondary">{subtitle}</span>
		{/if}
	</span>
	{#if badge}
		<span class="trow-badge">
			<TIcon name="alert" size={13} strokeWidth={2.4} />
			<span class="t-caption2">{badge}</span>
		</span>
	{:else if detail}
		<span class="trow-detail t-body t-secondary">{detail}</span>
	{/if}
	{#if suffix}
		<span class="trow-suffix">{@render suffix()}</span>
	{/if}
	{#if chevron}
		<span class="trow-chevron" aria-hidden="true">
			<TIcon name="chevronRight" size={17} strokeWidth={2.4} />
		</span>
	{/if}
{/snippet}

<div class="trow-wrap">
	<div class="trow-divider" class:with-icon={Boolean(icon)} aria-hidden="true"></div>
	{#if href && !disabled}
		<a {href} class="trow t-press" class:is-interactive={interactive} aria-label={label ?? title}>
			{@render body()}
		</a>
	{:else}
		<button
			type="button"
			class="trow t-press"
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
	.trow-divider {
		height: 1px;
		background: var(--ios-separator);
		margin-left: var(--s4);
	}
	.trow-divider.with-icon {
		margin-left: calc(var(--s4) + var(--tile-size) + var(--s3));
	}
	.trow-wrap:first-child .trow-divider {
		display: none;
	}
	.trow {
		display: flex;
		align-items: center;
		gap: var(--s3);
		width: 100%;
		min-height: var(--row-min);
		padding: var(--s2) var(--s4);
		background: transparent;
		border: 0;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
	}
	.trow.is-interactive {
		cursor: pointer;
	}
	.trow:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.trow-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--tile-size);
		height: var(--tile-size);
		border-radius: var(--r-tile);
		color: #fff;
		flex-shrink: 0;
	}
	.trow-texts {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
		gap: 1px;
	}
	.trow-title,
	.trow-subtitle {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.t-destructive {
		color: var(--ios-red);
	}
	.trow-detail {
		flex-shrink: 0;
		max-width: 40%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.trow-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
		padding: 3px 8px;
		border-radius: 999px;
		background: var(--ios-red);
		color: #fff;
		font-weight: 600;
	}
	.trow-suffix {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.trow-chevron {
		display: flex;
		color: var(--ios-label-3);
		flex-shrink: 0;
	}
</style>
