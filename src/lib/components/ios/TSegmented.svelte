<script lang="ts">
	/* Segmented control iOS: radiogroup accesible, segmento seleccionado elevado. */
	let {
		options,
		value,
		onchange,
		label,
	}: {
		options: { value: string; label: string }[];
		value: string;
		onchange: (v: string) => void;
		label: string;
	} = $props();
</script>

<div class="tseg" role="radiogroup" aria-label={label}>
	{#each options as opt (opt.value)}
		{@const active = opt.value === value}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			class="tseg-opt t-press"
			class:is-active={active}
			onclick={() => onchange(opt.value)}
		>
			{opt.label}
		</button>
	{/each}
</div>

<style>
	.tseg {
		display: inline-flex;
		padding: 2px;
		gap: 0;
		border-radius: var(--r-sm);
		background: var(--ios-fill);
	}
	.tseg-opt {
		min-height: 2rem;
		padding: var(--s1) var(--s4);
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--ios-label);
		font-size: var(--t-subhead);
		line-height: var(--t-lh-subhead);
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background var(--dur-fast) var(--ease-ios),
			box-shadow var(--dur-fast) var(--ease-ios);
	}
	.tseg-opt.is-active {
		background: var(--ios-grouped-2);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 0 0 0.5px rgba(0, 0, 0, 0.08);
		font-weight: 600;
	}
</style>
