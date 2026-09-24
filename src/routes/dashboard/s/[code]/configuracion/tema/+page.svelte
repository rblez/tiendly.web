<script lang="ts">
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
</script>

<svelte:head><title>Tema | Tiendly</title></svelte:head>

<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<div class="bg-card border border-hairline rounded-card p-5">
		<p class="text-sm font-medium text-body mb-1">Tema de la interfaz</p>
		<p class="mb-4 text-xs leading-5 text-muted">
			Automático sigue la configuración de tu dispositivo. La preferencia se guarda en este navegador.
		</p>
		<ThemeToggle variant="cards" />
	</div>
</div>
