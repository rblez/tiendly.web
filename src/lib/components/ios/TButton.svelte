<script lang="ts">
	/* Botón iOS: altura mínima 44pt, variantes filled/tinted/gray/destructive. */
	import type { Snippet } from "svelte";

	let {
		variant = "filled",
		href,
		onclick,
		disabled = false,
		full = false,
		children,
		label,
	}: {
		variant?: "filled" | "tinted" | "gray" | "destructive" | "plain";
		href?: string;
		onclick?: () => void;
		disabled?: boolean;
		full?: boolean;
		children: Snippet;
		label?: string;
	} = $props();
</script>

{#if href && !disabled}
	<a {href} class="tbtn t-press {variant}" class:full aria-label={label}>
		{@render children()}
	</a>
{:else}
	<button
		type="button"
		class="tbtn t-press {variant}"
		class:full
		onclick={disabled ? undefined : onclick}
		{disabled}
		aria-label={label}
	>
		{@render children()}
	</button>
{/if}

<style>
	.tbtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s2);
		min-height: var(--touch-min);
		padding: var(--s2) var(--s5);
		border: 0;
		border-radius: var(--r-md);
		font-size: var(--t-body);
		line-height: var(--t-lh-body);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition:
			filter var(--dur-fast) var(--ease-ios),
			opacity var(--dur-fast) var(--ease-ios);
	}
	.tbtn.full {
		width: 100%;
	}
	.tbtn:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.tbtn.filled {
		background: var(--ios-tint);
		color: #fff;
	}
	.tbtn.tinted {
		background: color-mix(in srgb, var(--ios-tint) 16%, transparent);
		color: var(--ios-tint-dark, var(--ios-tint));
	}
	.tbtn.gray {
		background: var(--ios-fill);
		color: var(--ios-blue);
	}
	.tbtn.destructive {
		background: var(--ios-red);
		color: #fff;
	}
	.tbtn.plain {
		background: transparent;
		color: var(--ios-blue);
		padding-left: var(--s2);
		padding-right: var(--s2);
	}
	.tbtn.filled:hover,
	.tbtn.destructive:hover {
		filter: brightness(1.06);
	}
</style>
