export interface ProjectEncryption {
	algorithm: 'aes-256-ctr' | (string & {});
	key: string;
}

// NOTE(afr): Adding a new tab item? Don't forget to update tab-preferences schema too!
export type TabItem =
	| RequestTabItem
	| VariableSetEditorTabItem
	| NewProjectIntroTabItem
	| PreferencesTabItem;

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
