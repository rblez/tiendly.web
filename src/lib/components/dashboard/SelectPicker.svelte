<script lang="ts">
	type Option = { value: string; label: string };
	let {
		value = $bindable(),
		options,
		id = undefined,
		label: fieldLabel = undefined,
		class: cls = '',
		variant = 'input'
	}: {
		value?: string | null;
		options: Option[];
		id?: string;
		label?: string;
		class?: string;
		variant?: 'input' | 'pill';
	} = $props();

	let open = $state(false);
	const current = $derived(options.find((o) => o.value === (value ?? ''))?.label ?? value ?? '');
	const triggerClass = $derived(
		variant === 'pill'
			? `select-pill select-pill-sm flex items-center justify-between gap-1.5 cursor-pointer select-none ${cls}`
			: `input flex items-center justify-between gap-1.5 cursor-pointer select-none ${cls}`
	);

	function bodyScrollLock(node: HTMLElement) {
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return { destroy() { document.body.style.overflow = prev; } };
	}
</script>

<button
	type="button"
	{id}
	class={triggerClass}
	onclick={() => (open = true)}
	aria-haspopup="dialog"
	aria-expanded={open}
>
	<span class="truncate">{current}</span>
	<i class="ri-arrow-down-s-line text-sm leading-none text-muted shrink-0" aria-hidden="true"></i>
</button>

{#if open}
	<div
		class="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-[10px] p-4 sm:p-6"
		style="display:flex;align-items:center;justify-content:center;background-color:rgba(0,0,0,0.65);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);"
		use:bodyScrollLock
		onclick={(e) => { if (e.target === e.currentTarget) open = false; }}
		onkeydown={(e) => { if (e.key === 'Escape') open = false; }}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="relative w-full max-w-sm max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto bg-card border border-hairline rounded-card shadow-2xl"
			style="margin:auto;background-color:var(--color-card);"
			role="dialog"
			aria-modal="true"
			aria-label={fieldLabel ?? 'Seleccionar una opción'}
		>
			<div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-hairline">
				{#if fieldLabel}<p class="text-sm font-semibold text-ink">{fieldLabel}</p>{/if}
				<button
					type="button"
					onclick={() => (open = false)}
					class="ml-auto w-8 h-8 flex items-center justify-center text-muted hover:text-error hover:bg-error/10 rounded-btn cursor-pointer"
					aria-label="Cerrar"
				><i class="ri-close-line"></i></button>
			</div>
			<div class="p-2 space-y-0.5">
				{#each options as opt (opt.value)}
					{@const isSelected = (value ?? '') === opt.value}
					<button
						type="button"
						role="option"
						aria-selected={isSelected}
						onclick={() => { value = opt.value; open = false; }}
						class="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-btn text-sm font-medium transition-colors cursor-pointer
							{isSelected ? 'bg-ember/10 text-ember' : 'text-body hover:bg-ember/10 hover:text-ember'}"
					>
						<span>{opt.label}</span>
						{#if isSelected}<i class="ri-check-line shrink-0"></i>{/if}
					</button>
				{/each}
			</div>
			<div class="h-2"></div>
		</div>
	</div>
{/if}
