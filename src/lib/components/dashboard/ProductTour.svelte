<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import { auth } from '$lib/stores/auth.svelte';

	type Step = { target: string; title: string; text: string; path: (code: string) => string; placement: 'top' | 'bottom' };
	const steps: Step[] = [
		{ target: '[data-tour="store-edit"]', title: 'Edita tu tienda', text: 'Aquí editas los datos de tu tienda.', path: (code) => `/dashboard/s/${code}`, placement: 'bottom' },
		{ target: '[data-tour="rates"]', title: 'Tasas CUP', text: 'Estos valores son sugeridos; tócalos para actualizarlos cuando cambie el mercado.', path: (code) => `/dashboard/s/${code}/configuracion`, placement: 'bottom' },
		{ target: '[data-tour="payments"]', title: 'Métodos de pago', text: 'Aquí activas o agregas tus formas de cobro.', path: (code) => `/dashboard/s/${code}/configuracion`, placement: 'bottom' },
		{ target: '[data-tour="add-product"]', title: 'Agrega tu primer producto', text: 'Así subes tu primer producto.', path: (code) => `/dashboard/s/${code}`, placement: 'top' },
		{ target: '[data-tour="status"]', title: 'Estado del servicio', text: 'Aquí ves si todo está funcionando bien.', path: (code) => `/dashboard/s/${code}`, placement: 'bottom' },
		{ target: '[data-tour="notifications"]', title: 'Notificaciones', text: 'Aquí llegan tus pedidos y avisos.', path: (code) => `/dashboard/s/${code}`, placement: 'bottom' },
		{ target: '[data-tour="share"]', title: 'Comparte tu tienda', text: 'Este es el link que compartes con tus clientes.', path: (code) => `/dashboard/s/${code}/configuracion`, placement: 'bottom' }
	];
	let open = $state(false);
	let index = $state(0);
	let rect = $state<DOMRect | null>(null);
	let current = $derived(steps[index]);
	const code = $derived($page.params.code ?? '');

	function locate() {
		if (!open) return;
		const element = document.querySelector(current.target);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
			requestAnimationFrame(() => { rect = element.getBoundingClientRect(); });
		}
	}
	async function goToStep(stepIndex: number) {
		const targetPath = steps[stepIndex].path(code);
		if (window.location.pathname !== targetPath) await goto(targetPath);
		index = stepIndex;
		requestAnimationFrame(locate);
	}
	async function start() { open = true; index = 0; await goToStep(0); }
	async function finish() {
		open = false; rect = null;
		if (auth.session) await supabase.from('profiles').update({ tutorial_completed: true }).eq('id', auth.session.user.id);
	}
	async function next() { if (index === steps.length - 1) return finish(); await goToStep(index + 1); }

	onMount(() => {
		const restart = () => start();
		document.addEventListener('tiendly:restart-tour', restart);
		const timer = window.setTimeout(() => { if (auth.ready && auth.session && auth.profile && !auth.profile.tutorial_completed) start(); }, 700);
		const update = () => locate();
		window.addEventListener('resize', update); window.addEventListener('scroll', update, true);
		return () => { document.removeEventListener('tiendly:restart-tour', restart); window.clearTimeout(timer); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
	});
</script>

{#if open && rect}
	<div class="fixed inset-0 z-[100] bg-black/70" aria-hidden="true" style={`clip-path:polygon(0 0, 0 100%, 100% 100%, 100% 0, 0 0, 0 ${rect.top - 8}px, ${rect.left - 8}px ${rect.top - 8}px, ${rect.left - 8}px ${rect.bottom + 8}px, ${rect.right + 8}px ${rect.bottom + 8}px, ${rect.right + 8}px ${rect.top - 8}px, 0 ${rect.top - 8}px)`}></div>
	<div class="pointer-events-none fixed z-[101] rounded-xl border-2 border-ember shadow-[0_0_0_5px_rgba(71,190,111,0.18)]" style={`left:${rect.left - 8}px;top:${rect.top - 8}px;width:${rect.width + 16}px;height:${rect.height + 16}px`}></div>
	<div class="fixed z-[102] w-[min(304px,calc(100vw-32px))] rounded-2xl border border-ember/30 bg-card p-5 text-left shadow-2xl" style={`left:${Math.max(16, Math.min(rect.left, window.innerWidth - 320))}px;top:${current.placement === 'top' ? Math.max(16, rect.top - 190) : Math.min(rect.bottom + 18, window.innerHeight - 190)}px`} role="dialog" aria-labelledby="tour-title">
		<div class="mb-3 flex items-center justify-between gap-3"><span class="text-xs font-semibold uppercase tracking-widest text-ember">{index + 1} de {steps.length}</span><button type="button" class="text-xs text-muted hover:text-ink" onclick={finish}>Saltar tutorial</button></div>
		<h2 id="tour-title" class="text-base font-bold text-ink">{current.title}</h2><p class="mt-2 text-sm leading-6 text-body">{current.text}</p>
		<div class="mt-4 flex justify-end"><button type="button" class="btn btn-3d btn-sm" onclick={next}>{index === steps.length - 1 ? 'Terminar' : 'Siguiente'}</button></div>
	</div>
{/if}
