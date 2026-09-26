<script lang="ts">
	/* Switch Material 3: 52×32dp, role="switch", operable por teclado. */
	let {
		checked,
		onchange,
		label,
		disabled = false,
	}: {
		checked: boolean;
		onchange: (v: boolean) => void;
		label: string;
		disabled?: boolean;
	} = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	{disabled}
	onclick={() => onchange(!checked)}
	class="hswitch hx-press"
	class:is-on={checked}
>
	<span class="hswitch-knob" aria-hidden="true"></span>
</button>

<style>
	.hswitch {
		position: relative;
		width: 3.25rem;
		height: 2rem;
		flex-shrink: 0;
		border: 2px solid var(--hx-text-3);
		border-radius: var(--hx-r-pill);
		background: transparent;
		cursor: pointer;
		transition:
			background var(--hx-dur) var(--hx-ease),
			border-color var(--hx-dur) var(--hx-ease);
	}
	.hswitch.is-on {
		background: var(--hx-accent);
		border-color: var(--hx-accent);
	}
	.hswitch:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.hswitch-knob {
		position: absolute;
		top: 50%;
		left: 4px;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: var(--hx-text-3);
		transform: translateY(-50%);
		transition:
			transform var(--hx-dur) var(--hx-ease),
			background var(--hx-dur) var(--hx-ease),
			width var(--hx-dur) var(--hx-ease);
	}
	.hswitch.is-on .hswitch-knob {
		transform: translate(1.5rem, -50%);
		background: var(--hx-accent-ink);
	}
	.hswitch:active .hswitch-knob {
		width: 1.375rem;
	}
</style>
