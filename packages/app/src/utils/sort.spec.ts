import { sortIso8601 } from './sort';

describe('sortIso8601', () => {
	it('should correctly sort by ascending', () => {
		const testData = [
			'2022-03-22T15:00:00+0000',
			'2021-03-22T15:00:00+0000',
			'2020-03-22T15:00:00+0000',
			'2024-03-22T15:00:00+0000',
		];
		const expectedData = [
			'2020-03-22T15:00:00+0000',
			'2021-03-22T15:00:00+0000',
			'2022-03-22T15:00:00+0000',
			'2024-03-22T15:00:00+0000',
		];

		const sortedData = testData.sort(sortIso8601(c => c, 'asc'));

		expect(sortedData).toStrictEqual(expectedData);
	});

	it('should correctly sort by descending', () => {
		const testData = [
			'2022-03-22T15:00:00+0000',
			'2021-03-22T15:00:00+0000',
			'2020-03-22T15:00:00+0000',
			'2024-03-22T15:00:00+0000',
		];
		const expectedData = [
			'2024-03-22T15:00:00+0000',
			'2022-03-22T15:00:00+0000',
			'2021-03-22T15:00:00+0000',
			'2020-03-22T15:00:00+0000',
		];

		const sortedData = testData.sort(sortIso8601(c => c, 'desc'));

		expect(sortedData).toStrictEqual(expectedData);
	})
});
