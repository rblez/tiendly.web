<script lang="ts">
	import { waLink } from '$lib/utils';

	interface Props {
		whatsapp: string | null;
	}

	let { whatsapp }: Props = $props();
</script>

{#if whatsapp}
	<a
		href={waLink(whatsapp, 'Hola, vi tu tienda en Tiendly y quería preguntarte algo.')}
		target="_blank"
		rel="noopener noreferrer"
		class="fixed bottom-5 left-5 z-40 flex items-center gap-2 bg-[#25d366] text-white pl-3.5 pr-4 py-3 rounded-full shadow-lg shadow-black/30 transition-transform duration-200 hover:scale-105 no-underline"
		aria-label="Escribir por WhatsApp"
	>
		<i class="ri-whatsapp-line text-xl"></i>
	</a>
{/if}
