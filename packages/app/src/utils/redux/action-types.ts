export function createAsyncActionTypes(actionType: string) {
	return {
		main: actionType,
		success: `${actionType}_SUCCESS`,
		failure: `${actionType}_FAILURE`,
	};
}
