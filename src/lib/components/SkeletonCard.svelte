<script lang="ts">
	let { count = 6 }: { count?: number } = $props();
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
	{#each Array(count) as _, i}
		<div class="bg-card border border-hairline rounded-card overflow-hidden animate-pulse">
			<div class="aspect-[4/3] bg-canvas"></div>
			<div class="p-5 space-y-3">
				<div class="h-5 bg-bone rounded w-3/4"></div>
				<div class="space-y-1.5">
					<div class="h-3 bg-bone rounded w-full"></div>
					<div class="h-3 bg-bone rounded w-2/3"></div>
				</div>
				<div class="h-6 bg-bone rounded w-1/3 mt-2"></div>
				<div class="h-10 bg-bone rounded-btn w-full mt-2"></div>
			</div>
		</div>
	{/each}
</div>
