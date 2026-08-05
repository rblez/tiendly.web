export type SortOrder = 'relevancia' | 'nuevos' | 'precio-asc' | 'precio-desc';

function createFiltersStore() {
	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);
	let sortOrder = $state<SortOrder>('relevancia');

	function setSearchQuery(value: string) {
		searchQuery = value;
	}

	function setCategory(value: string | null) {
		selectedCategory = value;
	}

	function setSortOrder(value: SortOrder) {
		sortOrder = value;
	}

	function resetFilters() {
		searchQuery = '';
		selectedCategory = null;
		sortOrder = 'relevancia';
	}

	return {
		get searchQuery() {
			return searchQuery;
		},
		get selectedCategory() {
			return selectedCategory;
		},
		get sortOrder() {
			return sortOrder;
		},
		setSearchQuery,
		setCategory,
		setSortOrder,
		resetFilters,
	};
}

export const filters = createFiltersStore();
