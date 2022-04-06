export interface MenuEventPayload {
	code: MenuEventCode;
}

export type MenuEventCode =
	'new_request' |
	'new_folder' |

	'toggle_sidebar' |

	'close_tab' |
	'close_all_tabs' |
	'close_other_tabs' |
	'select_next_tab' |
	'select_previous_tab' |

	'execute_request' |
	'view_project_encryption';
