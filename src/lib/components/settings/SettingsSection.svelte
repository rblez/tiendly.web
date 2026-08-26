<script lang="ts">
	let { title, children } = $props<{ title: string; children: import('svelte').Snippet }>();
</script>

<div class="mb-7">
	<div class="acrylic bg-card/90 border border-hairline rounded-card overflow-hidden shadow-sm">
		<div class="px-4 pt-4 pb-2 sm:px-5">
			<h3 class="text-sm font-bold text-ember">{title}</h3>
		</div>
		{@render children()}
	</div>
</div>
