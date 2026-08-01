function createFiltersStore() {
	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);

	function setSearchQuery(value: string) {
		searchQuery = value;
	}

	function setCategory(value: string | null) {
		selectedCategory = value;
	}

	function resetFilters() {
		searchQuery = '';
		selectedCategory = null;
	}

	return {
		get searchQuery() {
			return searchQuery;
		},
		get selectedCategory() {
			return selectedCategory;
		},
		setSearchQuery,
		setCategory,
		resetFilters,
	};
}

export const filters = createFiltersStore();
