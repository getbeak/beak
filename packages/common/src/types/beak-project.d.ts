export interface ProjectEncryption {
	algorithm: 'aes-256-ctr';
	key: string;
}

// NOTE(afr): Adding a new tab item? Don't forget to update tab-preferences schema too!
export type TabItem = RequestTabItem | VariableGroupEditorTabItem | NewProjectIntroTabItem;

export interface TabBase {
	type: string;
	payload: unknown;
	temporary: boolean;
}

export interface RequestTabItem extends TabBase {
	type: 'request';
	payload: string;
}

export interface VariableGroupEditorTabItem extends TabBase {
	type: 'variable_group_editor';
	payload: string;
}

export interface NewProjectIntroTabItem extends TabBase {
	type: 'new_project_intro';
	payload: 'new_project_intro';
}
