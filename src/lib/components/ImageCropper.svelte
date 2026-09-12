<script lang="ts">
	import { fileToDataUrl } from "$lib/utils";
	let { file, onconfirm, oncancel }: { file: File; onconfirm: (file: File) => void; oncancel: () => void } = $props();
	let imageUrl = $state("");
	let zoom = $state(1);
	let processing = $state(false);
	let canvas: HTMLCanvasElement;

	$effect(() => { fileToDataUrl(file).then((url) => (imageUrl = url)); });

	async function confirmCrop() {
		if (!imageUrl || !canvas) return;
		processing = true;
		const image = new Image();
		image.onload = () => {
			const size = Math.min(image.width, image.height) / zoom;
			const sx = (image.width - size) / 2;
			const sy = (image.height - size) / 2;
			canvas.width = 800; canvas.height = 800;
			canvas.getContext("2d")?.drawImage(image, sx, sy, size, size, 0, 0, 800, 800);
			canvas.toBlob((blob) => {
				if (blob) onconfirm(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
				processing = false;
			}, "image/jpeg", 0.9);
		};
		image.src = imageUrl;
	}
</script>

<div class="fixed inset-0 z-[90] isolate flex items-center justify-center bg-ink/90 p-4 backdrop-blur-[12px]" role="dialog" aria-modal="true" aria-label="Recortar imagen">
	<div class="w-full max-w-md rounded-card border border-hairline bg-card p-5 shadow-xl">
		<h2 class="text-lg font-bold text-ink">Ajustar imagen</h2>
		<p class="mt-1 text-sm text-muted">Recorta y ajusta el encuadre antes de subirla.</p>
		<div class="mt-5 aspect-square overflow-hidden rounded-btn bg-canvas">
			{#if imageUrl}<img src={imageUrl} alt="Vista previa para recortar" class="h-full w-full object-cover" style={`transform: scale(${zoom});`} />{/if}
		</div>
		<label class="mt-4 block text-sm text-muted">Zoom
			<input class="mt-2 w-full accent-ember" type="range" min="1" max="3" step="0.05" bind:value={zoom} />
		</label>
		<canvas bind:this={canvas} class="hidden"></canvas>
		<div class="mt-5 flex justify-end gap-3">
			<button class="btn btn-secondary btn-sm" onclick={oncancel} disabled={processing}>Cancelar</button>
			<button class="btn btn-3d btn-sm" onclick={confirmCrop} disabled={processing}>{processing ? "Procesando..." : "Usar imagen"}</button>
		</div>
	</div>
</div>

{#if processing}<div class="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 backdrop-blur-md" aria-live="polite"><div class="rounded-btn bg-card px-5 py-4 text-sm font-medium text-ink"><i class="ri-loader-4-line mr-2 animate-spin"></i>Subiendo imagen...</div></div>{/if}
<style>img { transition: transform 180ms ease; }</style>
