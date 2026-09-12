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
	<div class="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 p-0 backdrop-blur-[10px]" role="presentation">
		<button type="button" class="fixed inset-0 cursor-default bg-black/45" onclick={onClose} aria-label="Cerrar"></button>
		<div class="relative w-full max-w-lg overflow-hidden rounded-t-[24px] border border-b-0 border-hairline bg-card shadow-2xl">
			<div class="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-soft/50" aria-hidden="true"></div>
			<div class="flex items-center justify-between px-5 pb-4 pt-5 sm:px-6">
				<h3 class="text-lg font-bold text-ink">{title}</h3>
				<button
					type="button"
					onclick={onClose}
					class="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-bone hover:text-ink"
					aria-label="Cerrar"
				>
					<i class="ri-close-line text-xl" aria-hidden="true"></i>
				</button>
			</div>
			<div class="border-t border-hairline px-3 pb-5 pt-3 sm:px-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
