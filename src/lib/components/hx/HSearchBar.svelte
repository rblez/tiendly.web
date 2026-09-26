<script lang="ts">
	/* Buscador estilo Xiaomi: campo de píldora completa. */
	import HIcon from "./HIcon.svelte";

	let {
		value = $bindable(""),
		placeholder = "Buscar",
		label = "Buscar",
	}: {
		value?: string;
		placeholder?: string;
		label?: string;
	} = $props();
</script>

<div class="hsearch">
	<span class="hsearch-icon" aria-hidden="true">
		<HIcon name="search" size={20} strokeWidth={2} />
	</span>
	<input
		type="search"
		bind:value
		{placeholder}
		aria-label={label}
		enterkeyhint="search"
	/>
	{#if value}
		<button
			type="button"
			class="hsearch-clear hx-press"
			aria-label="Borrar búsqueda"
			onclick={() => (value = "")}
		>
			<HIcon name="x" size={16} strokeWidth={2.4} />
		</button>
	{/if}
</div>

<style>
	.hsearch {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-height: 3rem;
		padding: 0 1rem;
		border-radius: var(--hx-r-pill);
		background: var(--hx-card);
		color: var(--hx-text-2);
		box-shadow: var(--hx-tile-shadow);
	}
	.hsearch-icon {
		display: flex;
		flex-shrink: 0;
	}
	.hsearch input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		color: var(--hx-text);
		font-size: var(--hx-t-title);
		padding: 0.625rem 0;
		outline: none;
	}
	.hsearch input::placeholder {
		color: var(--hx-text-3);
	}
	.hsearch-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border: 0;
		border-radius: 50%;
		background: var(--hx-card-2);
		color: var(--hx-text-2);
		cursor: pointer;
	}
</style>
