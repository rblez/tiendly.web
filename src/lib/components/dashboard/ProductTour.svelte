<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';

	type Step = { target: string; title: string; text: string };
	const steps: Step[] = [
		{ target: '[data-tour="store-edit"]', title: 'Edita tu tienda', text: 'Aquí editas los datos de tu tienda.' },
		{ target: '[data-tour="rates"]', title: 'Tasas CUP', text: 'Estos valores son sugeridos; tócalos para actualizarlos cuando cambie el mercado.' },
		{ target: '[data-tour="payments"]', title: 'Métodos de pago', text: 'Aquí activas o agregas tus formas de cobro.' },
		{ target: '[data-tour="add-product"]', title: 'Agrega tu primer producto', text: 'Así subes tu primer producto.' },
		{ target: '[data-tour="status"]', title: 'Estado del servicio', text: 'Aquí ves si todo está funcionando bien.' },
		{ target: '[data-tour="notifications"]', title: 'Notificaciones', text: 'Aquí llegan tus pedidos y avisos.' },
		{ target: '[data-tour="share"]', title: 'Comparte tu tienda', text: 'Este es el link que compartes con tus clientes.' }
	];
	let open = $state(false);
	let index = $state(0);
	let rect = $state<DOMRect | null>(null);
	let expanded = $derived(open && rect);
	let current = $derived(steps[index]);

	function locate() {
		if (!open) return;
		const element = document.querySelector(current.target);
		if (element) rect = element.getBoundingClientRect();
	}
	function start() {
		index = 0;
		open = true;
		requestAnimationFrame(locate);
	}
	async function finish() {
		open = false;
		rect = null;
		if (auth.session) await supabase.from('profiles').update({ tutorial_completed: true }).eq('id', auth.session.user.id);
	}
	function next() {
		if (index === steps.length - 1) return finish();
		index += 1;
		requestAnimationFrame(locate);
	}
	$effect(() => {
		document.addEventListener('tiendly:restart-tour', start);
		return () => document.removeEventListener('tiendly:restart-tour', start);
	});
	$effect(() => {
		if (auth.ready && auth.session && auth.profile && !auth.profile.tutorial_completed) {
			const timer = window.setTimeout(start, 700);
			return () => window.clearTimeout(timer);
		}
	});
	$effect(() => {
		if (!open) return;
		window.addEventListener('resize', locate);
		window.addEventListener('scroll', locate, true);
		return () => { window.removeEventListener('resize', locate); window.removeEventListener('scroll', locate, true); };
	});
	export function restart() { start(); }
</script>

{#if expanded}
	<div class="fixed inset-0 z-[100] bg-black/65 backdrop-blur-[2px]" aria-hidden="true"></div>
	<div class="fixed z-[101] rounded-2xl border border-ember/30 bg-card p-5 text-left shadow-2xl" style={`left:${Math.max(16, Math.min(rect!.left, window.innerWidth - 320))}px; top:${Math.min(rect!.bottom + 16, window.innerHeight - 190)}px; width:min(304px, calc(100vw - 32px));`} role="dialog" aria-labelledby="tour-title">
		<div class="mb-3 flex items-center justify-between gap-3"><span class="text-xs font-semibold uppercase tracking-widest text-ember">{index + 1} de {steps.length}</span><button type="button" class="text-xs text-muted hover:text-ink" onclick={finish}>Saltar tutorial</button></div>
		<h2 id="tour-title" class="text-base font-bold text-ink">{current.title}</h2><p class="mt-2 text-sm leading-6 text-body">{current.text}</p>
		<div class="mt-4 flex justify-end"><button type="button" class="btn btn-3d btn-sm" onclick={next}>{index === steps.length - 1 ? 'Terminar' : 'Siguiente'}</button></div>
	</div>
{/if}
