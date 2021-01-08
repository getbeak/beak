export interface QueryablePromise<T> extends Promise<T> {
	isFulfilled: () => boolean;
	isPending: () => boolean;
	isRejected: () => boolean;
}

// This function allow you to modify a JS Promise by adding some status properties.
// Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
// But modified according to the specs of promises : https://promisesaplus.com/
export function makeQueryablePromise<T>(promise: Promise<T>): QueryablePromise<T> {
	// Don't modify any promise that has been already modified.
	// @ts-ignore
	if (promise.isResolved) return promise;

	// Set initial state
	let isPending = true;
	let isRejected = false;
	let isFulfilled = false;

	// Observe the promise, saving the fulfillment in a closure scope.
	const result = {
		...promise.then(
			f => {
				isFulfilled = true;
				isPending = false;

				return f;
			},
			p => {
				isRejected = true;
				isPending = false;

				throw p;
			},
		),
		isFulfilled: () => isFulfilled,
		isPending: () => isPending,
		isRejected: () => isRejected,
	};

	return result;
};
