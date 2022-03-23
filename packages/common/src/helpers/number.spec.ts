import { calculatePercentage } from './number';

describe('calculatePercentage', () => {
	it('calculates percentage correctly', () => {
		expect(calculatePercentage(50, 100, true)).toEqual(50);
	});
	it('handles rounding', () => {
		expect(calculatePercentage(50.01, 100, false)).toEqual(50.01);
		expect(calculatePercentage(50.01, 100, true)).toEqual(50);
	});
	it('can deal with complex ranges', () => {
		expect(calculatePercentage(0.25, 1, false)).toEqual(25);
		expect(calculatePercentage(75000, 100000, true)).toEqual(75);
	});
});
