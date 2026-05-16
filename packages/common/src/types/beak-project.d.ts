export interface ProjectEncryption {
	algorithm: 'aes-256-ctr' | (string & {});
	key: string;
}

// NOTE(afr): Adding a new tab item? Don't forget to update tab-preferences schema too!
export type TabItem =
	| RequestTabItem
	| VariableSetEditorTabItem
	| NewProjectIntroTabItem
	| PreferencesTabItem
	| ProjectHomeTabItem
	| FolderOverviewTabItem
	| CookieJarTabItem
	| WorkflowEditorTabItem
	| VariableInputPlaygroundTabItem;

export interface TabBase {
	type: string;
	payload: unknown;
	temporary: boolean;
}

export interface RequestTabItem extends TabBase {
	type: 'request';
	payload: string;
}

export interface VariableSetEditorTabItem extends TabBase {
	type: 'variable_set_editor';
	payload: string;
}

export interface NewProjectIntroTabItem extends TabBase {
	type: 'new_project_intro';
	payload: 'new_project_intro';
}

/**
 * Settings/preferences rendered as a tab inside a project window. Replaces the
 * standalone preferences window for the in-project use case. The standalone
 * window remains the fallback when no project is open.
 */
export interface PreferencesTabItem extends TabBase {
	type: 'preferences';
	payload: 'preferences';
}

/**
 * Project-level dashboard tab — manages OpenAPI sync sources and other
 * project-wide controls. One per project window.
 */
export interface ProjectHomeTabItem extends TabBase {
	type: 'project_home';
	payload: 'project_home';
}

/**
 * Folder overview — a dashboard for a single folder node. Payload is the
 * folder's node id (same id used as a tree key). Lists the folder's direct
 * children with quick-open affordances; intended landing surface when a
 * user clicks a folder in the project sidebar.
 */
export interface FolderOverviewTabItem extends TabBase {
	type: 'folder_overview';
	payload: string;
}

/**
 * Inspector for the project's cookie jars (one per variable set, partitioned
 * by item). Lets the user view, edit, and clear cookies captured from
 * `Set-Cookie` responses.
 */
export interface CookieJarTabItem extends TabBase {
	type: 'cookie_jar';
	payload: 'cookie_jar';
}

/**
 * Workflow editor — xyflow-based visual builder for a single workflow. The
 * payload is the workflow id (matches the on-disk filename `workflows/<id>.json`).
 */
export interface WorkflowEditorTabItem extends TabBase {
	type: 'workflow_editor';
	payload: string;
}

/**
 * Variable input playground — dev-only sandbox for exercising the
 * `VariableInput` component in isolation, with preset scenarios and a live
 * debug panel (ValueSections, selection state, event log).
 */
export interface VariableInputPlaygroundTabItem extends TabBase {
	type: 'variable_input_playground';
	payload: 'variable_input_playground';
}
