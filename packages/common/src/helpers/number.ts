export function calculatePercentage(partialValue: number, totalValue: number, round = false) {
	const percent = (100 * partialValue) / totalValue;

	return round ? Math.round(percent) : percent;
}
