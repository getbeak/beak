export function selectNextLogicalNode(root: HTMLElement, selected: HTMLElement) {
	const { focusableNodes, currentIndex } = gatherFocusState(root, selected);
	const nextNode = focusableNodes[currentIndex + 1];

	nextNode?.focus();
}

export function selectPreviousLogicalNode(root: HTMLElement, selected: HTMLElement) {
	const { focusableNodes, currentIndex } = gatherFocusState(root, selected);
	const nextNode = focusableNodes[currentIndex - 1];

	nextNode?.focus();
}

function gatherFocusState(root: HTMLElement, selected: HTMLElement) {
	const queryResult = root.querySelectorAll('[tabindex]');
	const focusableNodes = Array.from(queryResult) as HTMLElement[];
	const currentIndex = focusableNodes.indexOf(selected);

	return { focusableNodes, currentIndex };
}
