import { ipcMain, shell } from 'electron';

ipcMain.on('misc:open_path_in_finder', (_event, filePath: string) => {
	shell.showItemInFolder(filePath);
});
