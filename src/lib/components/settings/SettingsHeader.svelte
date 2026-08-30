<script lang="ts">
	let { backHref, title = 'Configuración' }: { backHref: string; title?: string } = $props();
</script>

<header class="relative flex h-20 items-center justify-center px-4 sm:h-24 sm:px-6">
	<a
		href={backHref}
		aria-label="Volver"
		class="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-card text-2xl text-ink shadow-sm transition-transform hover:scale-105 active:scale-95 sm:left-6"
	>
		<span aria-hidden="true">←</span>
	</a>
	<h1 class="text-xl font-bold text-ink sm:text-2xl">{title}</h1>
</header>
