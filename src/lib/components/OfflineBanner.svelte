<script lang="ts">
	let online = $state(true);
	let dismissed = $state(false);

	const DISMISS_KEY = 'tiendly.offline.dismissed';

	$effect(() => {
		online = navigator.onLine;

		if (!online) dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';

		function handleOnline() {
			online = true;
			dismissed = false;
			sessionStorage.removeItem(DISMISS_KEY);
		}
		function handleOffline() {
			online = false;
			dismissed = false;
		}

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	function dismiss() {
		dismissed = true;
		sessionStorage.setItem(DISMISS_KEY, '1');
	}
</script>

{#if !online && !dismissed}
	<div
		class="fixed top-0 inset-x-0 z-[80] pointer-events-none"
		role="status"
		aria-live="polite"
	>
		<div
			class="pointer-events-auto bg-neutral-900/95 backdrop-blur text-white text-xs sm:text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-lg animate-[offline-in_.25s_ease]"
		>
			<i class="ri-wifi-off-line text-sm text-ember flex-shrink-0"></i>
			<span class="truncate">Sin conexión — puedes seguir navegando, pero no podrás enviar el pedido hasta reconectar.</span>
			<button
				onclick={dismiss}
				class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
				aria-label="Cerrar aviso"
			>
				<i class="ri-close-line text-sm"></i>
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes offline-in {
		from { transform: translateY(-100%); }
		to { transform: translateY(0); }
	}
</style>