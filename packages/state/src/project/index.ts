// Actions, reducer, and selectors from the createSlice migration (ADR 0005 §1, §3).
export {
	default as projectReducer,
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	markNoProject,
	materialiseInMemoryProject,
	moveNodeInTree,
	projectLoadFailed,
	projectOpened,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	renameNodeInTree,
	renameProject,
	selectIsDiskProject,
	selectIsMemoryProject,
	selectProjectCookies,
	selectProjectFolderPath,
	selectProjectId,
	selectProjectLoadError,
	// Named selectors (ADR 0005 §3)
	selectProjectLoaded,
	selectProjectMode,
	selectProjectName,
	selectProjectTree,
	// Action creators (names preserved — no call-site changes required)
	startProject,
} from './project-slice';
// Types used by consumers (the UI composes ProjectTreeState into its wider State).
// Payload types for actions that are dispatched by the UI.
export type {
	MaterialiseInMemoryProjectPayload,
	MoveNodeInTreePayload,
	ProjectInfoPayload,
	ProjectLoadFailedPayload,
	ProjectMode,
	ProjectOpenedPayload,
	ProjectTreeState,
	RenameNodeInTreePayload,
	RenameProjectPayload,
} from './types';
export { initialProjectTreeState } from './types';
