<script lang="ts">
	import type { Snippet } from 'svelte';

	let { url, className, children }: { url: string; className?: string; children: Snippet } = $props();
</script>

<div class="rounded-2xl border border-hairline bg-card shadow-xl shadow-black/10 overflow-hidden {className ?? ''}">
	<div class="flex items-center gap-1.5 px-4 py-2.5 border-b border-hairline bg-canvas/60">
		<span class="h-2.5 w-2.5 rounded-full bg-bone"></span>
		<span class="h-2.5 w-2.5 rounded-full bg-bone"></span>
		<span class="h-2.5 w-2.5 rounded-full bg-bone"></span>
		<span class="mx-auto flex items-center gap-1.5 bg-bone/70 rounded-full px-3 py-1 text-[10px] text-muted truncate max-w-[60%]">
			<i class="ri-lock-2-line text-[10px] flex-shrink-0"></i>
			{url}
		</span>
	</div>
	{@render children()}
</div>
