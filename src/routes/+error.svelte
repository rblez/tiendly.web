<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
	<div class="w-16 h-16 bg-card border border-hairline rounded-full flex items-center justify-center mb-5">
		<i class="ri-error-warning-line text-2xl text-ember"></i>
	</div>
	<h1 class="text-2xl font-bold text-ink mb-2">{$page.status}</h1>
	<p class="text-body mb-6">{$page.error?.message ?? 'Algo salió mal.'}</p>
	<a href="/" class="bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium hover:bg-ember-active no-underline">
		Volver al inicio
	</a>
</div>
