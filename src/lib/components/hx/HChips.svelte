<script lang="ts">
	/* Chips de elección estilo Xiaomi (Accesibilidad): seleccionado relleno,
	   resto con borde. Desplazan horizontal si no caben. */
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

<div class="hchips" role="radiogroup" aria-label={label}>
	{#each options as opt (opt.value)}
		{@const active = opt.value === value}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			class="hchip hx-press"
			class:is-active={active}
			onclick={() => onchange(opt.value)}
		>
			{opt.label}
		</button>
	{/each}
</div>

<style>
	.hchips {
		display: flex;
		gap: 0.625rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		margin-bottom: 1.25rem;
		scrollbar-width: none;
	}
	.hchips::-webkit-scrollbar {
		display: none;
	}
	.hchip {
		flex-shrink: 0;
		min-height: 2.75rem;
		padding: 0 1.5rem;
		border: 1px solid var(--hx-text-3);
		border-radius: 0.875rem;
		background: transparent;
		color: var(--hx-text-2);
		font-size: var(--hx-t-title);
		font-weight: 500;
		cursor: pointer;
		transition:
			background var(--hx-dur) var(--hx-ease),
			color var(--hx-dur) var(--hx-ease),
			border-color var(--hx-dur) var(--hx-ease);
	}
	.hchip.is-active {
		background: var(--hx-card-2);
		border-color: transparent;
		color: var(--hx-text);
		font-weight: 600;
	}
</style>
