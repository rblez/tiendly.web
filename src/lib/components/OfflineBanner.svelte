<script lang="ts">
	let online = $state(true);
	let dismissed = $state(false);

	$effect(() => {
		online = navigator.onLine;

		function handleOnline() { online = true; dismissed = false; }
		function handleOffline() { online = false; dismissed = false; }

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

{#if !online && !dismissed}
	<div class="fixed bottom-0 inset-x-0 z-[70] p-4 sm:p-6 pointer-events-none">
		<div class="max-w-md mx-auto bg-card border border-hairline rounded-card p-5 shadow-2xl pointer-events-auto">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-ember/10 rounded-full">
					<i class="ri-wifi-off-line text-xl text-ember"></i>
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold text-ink">Sin conexión a internet</p>
					<p class="text-xs text-body mt-1">
						Puedes seguir navegando y armando tu pedido. Cuando recuperes conexión podrás enviarlo.
					</p>
				</div>
				<button
					onclick={() => dismissed = true}
					class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted-soft hover:text-ink transition-colors cursor-pointer"
					aria-label="Cerrar"
				>
					<i class="ri-close-line text-sm"></i>
				</button>
			</div>
		</div>
	</div>
{/if}
