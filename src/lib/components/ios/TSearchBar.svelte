<script lang="ts">
	/* Barra de búsqueda iOS: campo 36pt, radio 10pt, botón cancelar. */
	import TIcon from "./TIcon.svelte";

	let {
		value = $bindable(""),
		placeholder = "Buscar",
		label = "Buscar",
	}: {
		value?: string;
		placeholder?: string;
		label?: string;
	} = $props();

	let focused = $state(false);
</script>

<div class="tsearch" class:is-focused={focused}>
	<span class="tsearch-icon" aria-hidden="true">
		<TIcon name="search" size={16} strokeWidth={2.2} />
	</span>
	<input
		type="search"
		bind:value
		{placeholder}
		aria-label={label}
		enterkeyhint="search"
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
	/>
	{#if value}
		<button
			type="button"
			class="tsearch-clear"
			aria-label="Borrar búsqueda"
			onclick={() => (value = "")}
		>
			<TIcon name="x" size={14} strokeWidth={2.6} />
		</button>
	{/if}
</div>

<style>
	.tsearch {
		display: flex;
		align-items: center;
		gap: var(--s2);
		min-height: 2.25rem;
		padding: 0 var(--s3);
		border-radius: var(--r-md);
		background: var(--ios-fill);
		color: var(--ios-label-2);
	}
	.tsearch-icon {
		display: flex;
		flex-shrink: 0;
	}
	.tsearch input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--ios-label);
		font-size: var(--t-body);
		line-height: var(--t-lh-body);
		padding: var(--s2) 0;
		outline: none;
	}
	.tsearch input::placeholder {
		color: var(--ios-label-2);
	}
	.tsearch-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		border: 0;
		border-radius: 50%;
		background: var(--ios-gray-3);
		color: var(--ios-bg);
		cursor: pointer;
	}
</style>
