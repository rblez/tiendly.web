let modalOpen = $state(false);

export function getModalOpen() {
	return modalOpen;
}

export function setModalOpen(value: boolean) {
	modalOpen = value;
	if (typeof document !== 'undefined') {
		if (value) {
			document.body.style.pointerEvents = 'none';
		} else {
			document.body.style.pointerEvents = '';
		}
	}
}
