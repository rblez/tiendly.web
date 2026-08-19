export const dashUi = (() => {
	let storeOpen = $state(true);
	let profileOpen = $state(true);
	return {
		get storeOpen() {
			return storeOpen;
		},
		get profileOpen() {
			return profileOpen;
		},
		toggleStore() {
			storeOpen = !storeOpen;
		},
		toggleProfile() {
			profileOpen = !profileOpen;
		},
		setStore(v: boolean) {
			storeOpen = v;
		},
		setProfile(v: boolean) {
			profileOpen = v;
		},
	};
})();