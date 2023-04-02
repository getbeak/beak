export interface MenuEventPayload {
	code: MenuEventCode;
}

export type MenuEventCode =
	'new_request' |
	'new_folder' |

	'toggle_sidebar' |
	'sidebar_show_project' |
	'sidebar_show_variables' |

	'close_tab' |
	'close_all_tabs' |
	'close_other_tabs' |
	'select_next_tab' |
	'select_previous_tab' |

	'execute_request' |
	'view_project_encryption' |
	'show_new_project_intro' |

	'show_omni_commands';
