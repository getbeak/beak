import type { SyncFromSpecRes } from '@beak/common/ipc/openapi';
import { createAction } from '@reduxjs/toolkit';

import { ActionTypes, type FilePicked } from './types';

export const start = createAction(ActionTypes.START);
export const filePicked = createAction<FilePicked>(ActionTypes.FILE_PICKED);
export const filePickCancelled = createAction(ActionTypes.FILE_PICK_CANCELLED);
export const folderChosen = createAction<{ targetFolder: string }>(ActionTypes.FOLDER_CHOSEN);
export const importResolved = createAction<{ outcome: SyncFromSpecRes; notice?: string }>(ActionTypes.IMPORT_RESOLVED);
export const importRejected = createAction<{ error: string }>(ActionTypes.IMPORT_REJECTED);
export const close = createAction(ActionTypes.CLOSE);

export default {
	start,
	filePicked,
	filePickCancelled,
	folderChosen,
	importResolved,
	importRejected,
	close,
};
