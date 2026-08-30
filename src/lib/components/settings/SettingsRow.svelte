<script lang="ts">
	let {
		icon,
		label,
		sublabel = '',
		color,
		href,
		onclick
	}: {
		icon: string;
		label: string;
		sublabel?: string;
		color?: string;
		href?: string;
		onclick?: () => void;
	} = $props();
</script>

{#snippet row()}
	<span
		class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0 {color ? '' : 'bg-bone border border-hairline text-body'}"
		style={color ? `background:${color};box-shadow:0 2px 0 rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.45);text-shadow:0 1px 1px rgba(0,0,0,0.15)` : ''}
	>
		<i class={icon}></i>
	</span>
	<span class="flex-1 min-w-0">
		<span class="block text-sm font-medium text-ink leading-tight">{label}</span>
		{#if sublabel}
			<span class="block text-xs text-muted truncate">{sublabel}</span>
		{/if}
	</span>
{/snippet}

{#if href}
	<a
		{href}
		class="flex items-center gap-4 px-4 py-4 sm:px-5 bg-transparent hover:bg-bone/50 active:bg-bone transition-colors cursor-pointer no-underline min-h-[76px]"
	>
		{@render row()}
	</a>
{:else}
	<button
		onclick={onclick}
		class="w-full flex items-center gap-4 px-4 py-4 sm:px-5 bg-transparent hover:bg-bone/50 active:bg-bone transition-colors cursor-pointer text-left min-h-[76px]"
	>
		{@render row()}
	</button>
{/if}
