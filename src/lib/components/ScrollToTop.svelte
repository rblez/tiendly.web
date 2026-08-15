<script lang="ts">
	let visible = $state(false);

	$effect(() => {
		function handleScroll() {
			visible = window.scrollY > 400;
		}

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<button
	onclick={scrollToTop}
	class="fixed right-4 sm:right-6 z-[55] w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-card border border-hairline text-body rounded-full shadow-lg hover:text-ember hover:border-ember/50 transition-all duration-300 cursor-pointer
		{visible ? 'bottom-6 sm:bottom-6 opacity-100 translate-y-0' : 'bottom-6 sm:bottom-6 opacity-0 translate-y-4 pointer-events-none'}"
	aria-label="Volver arriba"
>
	<i class="ri-arrow-up-line text-lg"></i>
</button>
