<script lang="ts">
        import { page } from '$app/stores';
        import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';

        let storeCode = $derived($page.params.code ?? '');
</script>

<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 pb-10">
        <div class="mb-7 pt-1">
                <h1 class="text-2xl sm:text-3xl font-bold text-ink">Categorías</h1>
                <p class="text-sm text-muted mt-1">Gestiona las categorías de tus productos.</p>
        </div>

        <div class="bg-card border border-hairline rounded-card p-8 text-center text-muted">
                Próximamente: Gestión avanzada de categorías.
        </div>
</section>