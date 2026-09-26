<script lang="ts">
	/* Switch iOS: 51×31pt, role="switch", operable por teclado. */
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
	class="tswitch t-press"
	class:is-on={checked}
>
	<span class="tswitch-knob" aria-hidden="true"></span>
</button>

<style>
	.tswitch {
		position: relative;
		width: 51px;
		height: 31px;
		flex-shrink: 0;
		border: 0;
		border-radius: 999px;
		background: var(--ios-switch-off);
		cursor: pointer;
		transition: background var(--dur-fast) var(--ease-ios);
	}
	.tswitch.is-on {
		background: var(--ios-tint);
	}
	.tswitch:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.tswitch-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 27px;
		height: 27px;
		border-radius: 50%;
		background: #fff;
		box-shadow:
			0 3px 8px rgba(0, 0, 0, 0.15),
			0 1px 1px rgba(0, 0, 0, 0.16);
		transition: transform var(--dur-fast) var(--ease-ios);
	}
	.tswitch.is-on .tswitch-knob {
		transform: translateX(20px);
	}
</style>
