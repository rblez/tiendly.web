<script lang="ts">
	/* Deslizador estilo Xiaomi: riel con relleno de acento y pomo blanco. */
	let {
		value,
		min = 0,
		max = 100,
		step = 1,
		onchange,
		label,
	}: {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		onchange: (v: number) => void;
		label: string;
	} = $props();

	const pct = $derived(((value - min) / (max - min)) * 100);
</script>

<div class="hslider">
	<input
		type="range"
		{min}
		{max}
		{step}
		value={value}
		aria-label={label}
		aria-valuetext={`${value}`}
		style:--fill={`${pct}%`}
		oninput={(e) => onchange(Number(e.currentTarget.value))}
	/>
</div>

<style>
	.hslider {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 2.75rem;
	}
	.hslider input[type="range"] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 1.75rem;
		border-radius: var(--hx-r-pill);
		cursor: pointer;
		background: linear-gradient(
			to right,
			var(--hx-accent) 0 var(--fill, 50%),
			var(--hx-card-2) var(--fill, 50%) 100%
		);
		background-size: 100% 0.375rem;
		background-repeat: no-repeat;
		background-position: center;
	}
	/* Riel: usamos el background del input como pista */
	.hslider input[type="range"]::-webkit-slider-runnable-track {
		height: 0.375rem;
		border-radius: var(--hx-r-pill);
		background: transparent;
	}
	.hslider input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1.5rem;
		height: 1.5rem;
		margin-top: -0.5625rem;
		border-radius: 50%;
		background: #fff;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.35),
			0 0 0 1px rgba(0, 0, 0, 0.08);
	}
	.hslider input[type="range"]::-moz-range-track {
		height: 0.375rem;
		border-radius: var(--hx-r-pill);
		background: var(--hx-card-2);
	}
	.hslider input[type="range"]::-moz-range-progress {
		height: 0.375rem;
		border-radius: var(--hx-r-pill);
		background: var(--hx-accent);
	}
	.hslider input[type="range"]::-moz-range-thumb {
		width: 1.5rem;
		height: 1.5rem;
		border: 0;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
	}
</style>
