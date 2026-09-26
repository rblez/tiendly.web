<script lang="ts">
	/* Segmented estilo Material: radiogroup, opción activa en píldora de acento. */
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

<div class="hseg" role="radiogroup" aria-label={label}>
	{#each options as opt (opt.value)}
		{@const active = opt.value === value}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			class="hseg-opt hx-press"
			class:is-active={active}
			onclick={() => onchange(opt.value)}
		>
			{opt.label}
		</button>
	{/each}
</div>

<style>
	.hseg {
		display: inline-flex;
		padding: 3px;
		border-radius: var(--hx-r-pill);
		background: var(--hx-card-2);
	}
	.hseg-opt {
		min-height: 2.25rem;
		padding: 0 1rem;
		border: 0;
		border-radius: var(--hx-r-pill);
		background: transparent;
		color: var(--hx-text-2);
		font-size: var(--hx-t-sub);
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background var(--hx-dur) var(--hx-ease),
			color var(--hx-dur) var(--hx-ease);
	}
	.hseg-opt.is-active {
		background: var(--hx-accent);
		color: var(--hx-accent-ink);
		font-weight: 600;
		box-shadow: var(--hx-tile-shadow);
	}
</style>
