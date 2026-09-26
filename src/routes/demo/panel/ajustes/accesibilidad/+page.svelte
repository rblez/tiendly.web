<script lang="ts">
	import HSubPage from "$lib/components/hx/HSubPage.svelte";
	import HSection from "$lib/components/hx/HSection.svelte";
	import HRow from "$lib/components/hx/HRow.svelte";
	import HSwitch from "$lib/components/hx/HSwitch.svelte";
	import HSegmented from "$lib/components/hx/HSegmented.svelte";
	import HChips from "$lib/components/hx/HChips.svelte";
	import HSlider from "$lib/components/hx/HSlider.svelte";
	import { appearance, type TextSize } from "$lib/stores/appearance.svelte";
	import { theme, type ThemePref } from "$lib/stores/theme.svelte";

	const SIZES: TextSize[] = ["s", "m", "l", "xl"];
	const SIZE_LABELS = ["Pequeño", "Mediano", "Grande", "Extragrande"];
	const sizeIdx = $derived(SIZES.indexOf(appearance.textSize));

	const CATS = [
		{ value: "general", label: "General" },
		{ value: "vision", label: "Visión" },
		{ value: "escucha", label: "Escucha" },
		{ value: "fisico", label: "Físico" },
	];
	let cat = $state("general");
	const showText = $derived(cat === "general" || cat === "vision");
	const showLook = $derived(cat === "general" || cat === "vision");
	const isEmpty = $derived(!showText && !showLook);

	const themeOpts: { value: ThemePref; label: string }[] = [
		{ value: "light", label: "Claro" },
		{ value: "dark", label: "Oscuro" },
		{ value: "auto", label: "Auto" },
	];
</script>

<svelte:head>
	<title>Vista previa · Accesibilidad | Tiendly</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<HSubPage title="Accesibilidad" backHref="/demo/panel/ajustes">
	<HChips options={CATS} value={cat} onchange={(v) => (cat = v)} label="Categorías de accesibilidad" />

	{#if showText}
		<HSection
			label="Texto"
			footer="El tamaño se aplica a todo el panel al instante."
		>
			<HRow title="Tamaño del texto" detail={SIZE_LABELS[sizeIdx]}>
				{#snippet suffix()}
					<div class="acc-slider">
						<HSlider
							value={sizeIdx}
							min={0}
							max={3}
							step={1}
							onchange={(v) => appearance.setTextSize(SIZES[v])}
							label="Tamaño del texto"
						/>
					</div>
				{/snippet}
			</HRow>
		</HSection>
	{/if}

	{#if showLook}
		<HSection label="Visualización">
			<HRow title="Apariencia" subtitle="Tema del panel">
				{#snippet suffix()}
					<HSegmented
						options={themeOpts}
						value={theme.pref}
						onchange={(v) => theme.set(v as ThemePref)}
						label="Apariencia"
					/>
				{/snippet}
			</HRow>
			<HRow title="Reducir movimiento" subtitle="Minimiza animaciones y transiciones">
				{#snippet suffix()}
					<HSwitch
						checked={appearance.reduceMotion}
						onchange={(v) => appearance.setReduceMotion(v)}
						label="Reducir movimiento"
					/>
				{/snippet}
			</HRow>
			<HRow title="Aumentar contraste" subtitle="Texto y separadores más marcados">
				{#snippet suffix()}
					<HSwitch
						checked={appearance.highContrast}
						onchange={(v) => appearance.setHighContrast(v)}
						label="Aumentar contraste"
					/>
				{/snippet}
			</HRow>
		</HSection>
	{/if}

	{#if isEmpty}
		<HSection label="Opciones">
			<HRow title="Sin opciones aquí" subtitle="Nada en esta categoría por ahora" />
		</HSection>
	{/if}
</HSubPage>

<style>
	.acc-slider {
		width: 9rem;
	}
</style>
