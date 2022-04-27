type Direction = 'forward' | 'backward';

interface MovePositionOptions {
	allowWrapping: true;
}

export function movePosition(arr: unknown[], currentIndex: number, direction: Direction, opts?: MovePositionOptions) {
	const maxArrayIndex = arr.length - 1;
	const options: MovePositionOptions = {
		allowWrapping: true,
		...opts,
	};

	let returnIndex = currentIndex;

	if (direction === 'backward') {
		returnIndex -= 1;

		// If within a valid range, return
		if (returnIndex >= 0)
			return returnIndex;

		// If invalid and wrapped, go to end
		if (options.allowWrapping)
			return maxArrayIndex;

		// Otherwise stick to start
		return 0;
	}

	returnIndex += 1;

	// If within a valid range, return
	if (returnIndex <= maxArrayIndex)
		return returnIndex;

	// If invalid and wrapped, go to start
	if (options.allowWrapping)
		return 0;

	// Otherwise stick to end
	return maxArrayIndex;
}
