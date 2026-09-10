<script lang="ts">
	let {
		value = $bindable(''),
		length = 6,
		disabled = false,
		label = 'Código de verificación',
	}: {
		value?: string;
		length?: number;
		disabled?: boolean;
		label?: string;
	} = $props();

	let inputs: HTMLInputElement[] = [];
	let digits = $derived(Array.from({ length }, (_, index) => value[index] ?? ''));

	function updateDigit(index: number, raw: string) {
		const digit = raw.replace(/\D/g, '').slice(-1);
		const next = [...digits];
		next[index] = digit;
		value = next.join('');
		if (digit && index < length - 1) inputs[index + 1]?.focus();
	}

	function handleKeydown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace' && !digits[index] && index > 0) {
			inputs[index - 1]?.focus();
		}
		if (event.key === 'ArrowLeft' && index > 0) inputs[index - 1]?.focus();
		if (event.key === 'ArrowRight' && index < length - 1) inputs[index + 1]?.focus();
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, length) ?? '';
		value = pasted;
		inputs[Math.min(pasted.length, length - 1)]?.focus();
	}
</script>

<div class="otp" role="group" aria-label={label} onpaste={handlePaste}>
	{#each digits as digit, index (index)}
		<input
			bind:this={inputs[index]}
			value={digit}
			type="text"
			inputmode="numeric"
			autocomplete={index === 0 ? 'one-time-code' : 'off'}
			maxlength="1"
			aria-label={`${label}, dígito ${index + 1} de ${length}`}
			disabled={disabled}
			oninput={(event) => updateDigit(index, event.currentTarget.value)}
			onkeydown={(event) => handleKeydown(index, event)}
		/>
	{/each}
</div>

<style>
	.otp {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.otp input {
		width: 2.75rem;
		height: 3.25rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		color: hsl(var(--foreground));
		font-size: 1.5rem;
		font-weight: 600;
		text-align: center;
		outline: none;
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	.otp input:focus {
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 3px hsl(var(--primary) / 0.18);
	}
</style>
