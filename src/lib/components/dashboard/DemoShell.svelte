<script lang="ts">
	/* Shell del demo con el sistema "Hyper" (Xiaomi/Telegram).
	   Misma API que antes para no romper las páginas del demo. */
	import type { Snippet } from "svelte";
	import HShell from "$lib/components/hx/HShell.svelte";

	type NavKey = "inicio" | "productos" | "pedidos" | "ajustes";

	let {
		initials: _initials,
		storeName,
		userName: _userName,
		active,
		children,
	}: {
		initials: string;
		storeName: string;
		userName: string;
		active: NavKey;
		children: Snippet;
	} = $props();
</script>

<HShell title={active === "ajustes" ? "Ajustes" : storeName} {active}>
	{@render children()}
</HShell>
