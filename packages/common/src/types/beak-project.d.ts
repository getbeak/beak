export interface ProjectEncryption {
	algorithm: 'aes-256-ctr' | (string & {});
	key: string;
}

// NOTE(afr): Adding a new tab item? Don't forget to update tab-preferences schema too!
export type TabItem = RequestTabItem | VariableSetEditorTabItem | NewProjectIntroTabItem;

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
