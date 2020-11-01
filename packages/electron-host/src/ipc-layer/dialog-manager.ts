import { dialog, ipcMain } from 'electron';

import { createVariableGroupEditorWindow, windowStack } from '../window-management';

ipcMain.handle('dialog:confirm_body_tab_change', async event => {
	const window = windowStack[event.sender.id]!;

	const result = await dialog.showMessageBox(window, {
		message: 'Are you sure you want to change body type? Doing so will cause any data in the current body to be wiped!',
		type: 'warning',
		buttons: [
			'Change',
			'Cancel',
		],
		defaultId: 1,
	});

	return result.response;
});

ipcMain.handle('dialog:project_variable_group_editor', async (_, projectPath) => {
	createVariableGroupEditorWindow(projectPath);
});
