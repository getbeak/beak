type Order = 'asc' | 'desc';

export function sortIso8601<T>(dateSelector: (object: T) => string, order: Order = 'desc') {
	return (a: T, b: T) => {
		const aDate = dateSelector(a);
		const bDate = dateSelector(b);

		if (order === 'asc')
			return aDate.localeCompare(bDate);

		return -aDate.localeCompare(bDate);
	};
}
