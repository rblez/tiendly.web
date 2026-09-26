<script lang="ts">
	export type SettingsRow = {
		icon: string;
		color: string;
		title: string;
		desc: string;
		status?: string;
		badge?: string;
	};
	export type SettingsGroup = { title: string; rows: SettingsRow[] };
	export type SettingsProfile = { initials: string; name: string; handle: string };

	let {
		profile,
		groups,
	}: {
		profile: SettingsProfile;
		groups: SettingsGroup[];
	} = $props();

	let query = $state("");
	const q = $derived(query.trim().toLowerCase());
	const visibleGroups = $derived(
		groups
			.map((g) => ({
				...g,
				rows: g.rows.filter(
					(r) => !q || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q),
				),
			}))
			.filter((g) => g.rows.length > 0),
	);
</script>

<div class="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
	<div class="mb-5">
		<h1 class="text-3xl font-bold tracking-tight text-ink">Ajustes</h1>
	</div>

	<div class="relative mb-5">
		<i class="ri-search-line pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-soft" aria-hidden="true"></i>
		<input
			type="search"
			bind:value={query}
			placeholder="Buscar en Ajustes"
			aria-label="Buscar en Ajustes"
			class="input w-full !rounded-full !py-2.5 !pl-10 !pr-4"
		/>
	</div>

	{#if !q}
		<section aria-label="Perfil de la tienda" class="mb-6 overflow-hidden rounded-[20px] border border-hairline bg-card">
			<div class="flex items-center gap-4 px-4 py-4">
				<span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ember text-lg font-black text-white" aria-hidden="true">
					{profile.initials}
				</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-base font-semibold text-ink">{profile.name}</p>
					<p class="truncate text-xs text-muted tabular-nums">@{profile.handle}</p>
				</div>
				<span class="flex shrink-0 items-center gap-1 text-sm font-medium text-ember">
					Ver tienda
					<i class="ri-arrow-right-s-line text-lg" aria-hidden="true"></i>
				</span>
			</div>
		</section>
	{/if}

	{#each visibleGroups as group (group.title)}
		<section class="mb-6" aria-label={group.title}>
			<h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted">{group.title}</h2>
			<div class="overflow-hidden rounded-[20px] border border-hairline bg-card">
				<ul class="divide-y divide-hairline-soft">
					{#each group.rows as row (row.title)}
						<li>
							<button type="button" class="group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-ember/5">
								<span class={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-lg text-white ${row.color}`} aria-hidden="true">
									<i class={row.icon}></i>
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-[15px] font-medium text-ink">{row.title}</span>
									<span class="block truncate text-xs text-muted">{row.desc}</span>
								</span>
								{#if row.badge}
									<span class="shrink-0 rounded-full bg-ember px-2.5 py-0.5 text-[11px] font-bold text-white">{row.badge}</span>
								{:else if row.status}
									<span class="shrink-0 truncate text-sm text-muted">{row.status}</span>
								{/if}
								<i class="ri-arrow-right-s-line shrink-0 text-lg text-muted-soft transition-transform group-hover:translate-x-0.5" aria-hidden="true"></i>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/each}

	{#if visibleGroups.length === 0}
		<div class="py-16 text-center">
			<i class="ri-search-line mb-3 block text-3xl text-muted-soft" aria-hidden="true"></i>
			<p class="text-sm font-medium text-body">Sin resultados para “{query.trim()}”</p>
			<p class="mt-1 text-xs text-muted">Prueba con otra palabra.</p>
		</div>
	{/if}
</div>
