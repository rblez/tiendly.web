<script lang="ts">
	import type { Snippet } from 'svelte';

	interface OptionModalProps {
		title: string;
		open: boolean;
		onClose: () => void;
		children: Snippet;
	}

	let { title, open, onClose, children }: OptionModalProps = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 backdrop-blur-md p-4" style="display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);" role="presentation">
		<button type="button" class="fixed inset-0 bg-black/35 cursor-default" onclick={onClose} aria-label="Cerrar"></button>
		<div class="relative w-full max-w-sm bg-card border border-hairline shadow-2xl rounded-card overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-hairline">
				<h3 class="font-bold text-ink">{title}</h3>
				<button onclick={onClose} class="w-8 h-8 flex items-center justify-center text-muted-soft hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
					<i class="ri-close-line text-xl"></i>
				</button>
			</div>
			<div class="p-3">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
