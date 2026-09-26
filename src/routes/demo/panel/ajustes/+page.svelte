<script lang="ts">
	import DemoShell from "$lib/components/dashboard/DemoShell.svelte";
	import HCard from "$lib/components/hx/HCard.svelte";
	import HRow from "$lib/components/hx/HRow.svelte";
	import HSwitch from "$lib/components/hx/HSwitch.svelte";
	import HSegmented from "$lib/components/hx/HSegmented.svelte";
	import HSearchBar from "$lib/components/hx/HSearchBar.svelte";
	import { appearance, type TextSize } from "$lib/stores/appearance.svelte";
	import { theme, type ThemePref } from "$lib/stores/theme.svelte";

	type RowKind = "link" | "textsize" | "apptheme" | "motion" | "contrast";
	type Row = {
		kind: RowKind;
		icon: string;
		tint: string;
		title: string;
		subtitle: string;
		detail?: string;
		badge?: string;
		href?: string;
	};
	type Group = { title: string; rows: Row[] };

	const profile = { initials: "BF", name: "Bodega La Fortuna", handle: "bodega-la-fortuna" };

	const groups: Group[] = [
		{
			title: "Tienda",
			rows: [
				{ kind: "link", icon: "store", tint: "orange", title: "Información general", subtitle: "Nombre, usuario y descripción", detail: "Bodega La Fortuna", href: "#" },
				{ kind: "link", icon: "image", tint: "purple", title: "Apariencia", subtitle: "Logo y color de la tienda", detail: "Verde", href: "#" },
				{ kind: "link", icon: "list", tint: "yellow", title: "Categorías", subtitle: "Organiza el catálogo de tu tienda", detail: "6", href: "#" },
				{ kind: "link", icon: "eye", tint: "blue", title: "Visibilidad", subtitle: "Visible u oculta en Tiendly", detail: "Visible", href: "#" },
				{ kind: "link", icon: "chat", tint: "green", title: "Contacto y modo de pedido", subtitle: "WhatsApp, Telegram y checkout", detail: "WhatsApp", href: "#" },
				{ kind: "link", icon: "share", tint: "pink", title: "Redes sociales", subtitle: "Canales oficiales de tu tienda", detail: "3 conectadas", href: "#" },
				{ kind: "link", icon: "pin", tint: "red", title: "Información adicional", subtitle: "Ubicación, horario y enlaces", detail: "La Habana", href: "#" },
				{ kind: "link", icon: "cash", tint: "teal", title: "Moneda y tasas", subtitle: "USD o CUP y conversión base", detail: "CUP", href: "#" },
				{ kind: "link", icon: "card", tint: "indigo", title: "Pagos", subtitle: "Métodos nativos y personalizados", detail: "2 métodos", href: "#" },
				{ kind: "link", icon: "ticket", tint: "orange", title: "Cupones y descuentos", subtitle: "Códigos, límites y fechas", detail: "1 activo", href: "#" },
			],
		},
		{
			title: "Accesibilidad",
			rows: [
				{ kind: "textsize", icon: "type", tint: "blue", title: "Tamaño del texto", subtitle: "Ajusta la letra de todo el panel" },
				{ kind: "apptheme", icon: "moon", tint: "indigo", title: "Apariencia", subtitle: "Claro, oscuro o automático" },
				{ kind: "motion", icon: "gauge", tint: "teal", title: "Reducir movimiento", subtitle: "Minimiza animaciones y transiciones" },
				{ kind: "contrast", icon: "contrast", tint: "gray", title: "Aumentar contraste", subtitle: "Texto y separadores más marcados" },
			],
		},
		{
			title: "Cuenta",
			rows: [
				{ kind: "link", icon: "user", tint: "blue", title: "Perfil", subtitle: "Nombre personal, teléfono y avatar", detail: "María", href: "#" },
				{ kind: "link", icon: "shield", tint: "green", title: "Seguridad", subtitle: "Contraseña, correo y sesiones", href: "#" },
				{ kind: "link", icon: "crown", tint: "yellow", title: "Plan", subtitle: "Tu suscripción actual", badge: "Gratis", href: "#" },
			],
		},
	];

	const textSizes: { value: TextSize; label: string }[] = [
		{ value: "s", label: "S" },
		{ value: "m", label: "M" },
		{ value: "l", label: "L" },
		{ value: "xl", label: "XL" },
	];
	const themeOpts: { value: ThemePref; label: string }[] = [
		{ value: "light", label: "Claro" },
		{ value: "dark", label: "Oscuro" },
		{ value: "auto", label: "Auto" },
	];

	let query = $state("");
	const q = $derived(query.trim().toLowerCase());
	const visibleGroups = $derived(
		groups
			.map((g) => ({
				...g,
				rows: g.rows.filter(
					(r) =>
						!q ||
						r.title.toLowerCase().includes(q) ||
						r.subtitle.toLowerCase().includes(q),
				),
			}))
			.filter((g) => g.rows.length > 0),
	);
</script>

<svelte:head>
	<title>Vista previa · Ajustes | Tiendly</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DemoShell initials="BF" storeName="Bodega La Fortuna" userName="María" active="ajustes">
	<div class="ajustes-search">
		<HSearchBar bind:value={query} placeholder="Buscar en Ajustes" />
	</div>

	{#if !q}
		<div class="ajustes-profile">
			<span class="ajustes-avatar" aria-hidden="true">{profile.initials}</span>
			<div class="ajustes-identity">
				<p class="ajustes-name">{profile.name}</p>
				<p class="ajustes-handle hx-t2">@{profile.handle}</p>
			</div>
		</div>
	{/if}

	{#each visibleGroups as group (group.title)}
		<HCard title={group.title}>
			{#each group.rows as row (row.title)}
				<HRow
					icon={row.icon}
					tint={row.tint}
					title={row.title}
					subtitle={row.subtitle}
					detail={row.detail}
					badge={row.badge}
					chevron={row.kind === "link"}
					href={row.href}
				>
					{#snippet suffix()}
						{#if row.kind === "textsize"}
							<HSegmented
								options={textSizes}
								value={appearance.textSize}
								onchange={(v) => appearance.setTextSize(v as TextSize)}
								label="Tamaño del texto"
							/>
						{:else if row.kind === "apptheme"}
							<HSegmented
								options={themeOpts}
								value={theme.pref}
								onchange={(v) => theme.set(v as ThemePref)}
								label="Apariencia"
							/>
						{:else if row.kind === "motion"}
							<HSwitch
								checked={appearance.reduceMotion}
								onchange={(v) => appearance.setReduceMotion(v)}
								label="Reducir movimiento"
							/>
						{:else if row.kind === "contrast"}
							<HSwitch
								checked={appearance.highContrast}
								onchange={(v) => appearance.setHighContrast(v)}
								label="Aumentar contraste"
							/>
						{/if}
					{/snippet}
				</HRow>
			{/each}
		</HCard>
	{/each}

	{#if visibleGroups.length === 0}
		<div class="ajustes-empty">
			<p class="hx-t2">Sin resultados para “{query.trim()}”</p>
			<p class="hx-t3 ajustes-empty-hint">Prueba con otra palabra.</p>
		</div>
	{/if}
</DemoShell>

<style>
	.ajustes-search {
		margin-bottom: 1rem;
	}
	.ajustes-profile {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0.5rem 1.25rem;
	}
	.ajustes-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4.5rem;
		height: 4.5rem;
		flex-shrink: 0;
		border-radius: 50%;
		background: var(--hx-accent);
		color: var(--hx-accent-ink);
		font-size: 1.5rem;
		font-weight: 600;
	}
	.ajustes-name {
		font-size: 1.375rem;
		font-weight: 600;
	}
	.ajustes-handle {
		font-size: var(--hx-t-title);
		margin-top: 2px;
	}
	.ajustes-empty {
		padding: 3rem 0;
		text-align: center;
	}
	.ajustes-empty-hint {
		margin-top: 0.25rem;
		font-size: var(--hx-t-sub);
	}
</style>
