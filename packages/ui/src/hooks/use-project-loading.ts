export function useProjectLoading(loaded: boolean, setup: boolean) {
	return !loaded || !setup;
}
