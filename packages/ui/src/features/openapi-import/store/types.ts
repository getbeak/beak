import type { SyncFromSpecRes } from '@beak/common/ipc/openapi';

export const ActionTypes = {
	START: '@beak/features/openapi-import/START',
	FILE_PICKED: '@beak/features/openapi-import/FILE_PICKED',
	FILE_PICK_CANCELLED: '@beak/features/openapi-import/FILE_PICK_CANCELLED',
	FOLDER_CHOSEN: '@beak/features/openapi-import/FOLDER_CHOSEN',
	IMPORT_RESOLVED: '@beak/features/openapi-import/IMPORT_RESOLVED',
	IMPORT_REJECTED: '@beak/features/openapi-import/IMPORT_REJECTED',
	CLOSE: '@beak/features/openapi-import/CLOSE',
};

export type Phase = 'idle' | 'picking-file' | 'picking-folder' | 'importing' | 'result';

export interface FilePicked {
	filename: string;
	source: string;
}

export interface State {
	phase: Phase;
	targetFolder: string;
	file?: FilePicked;
	result?:
		| { ok: true; outcome: SyncFromSpecRes; notice?: string }
		| { ok: false; error: string };
}

export const initialState: State = {
	phase: 'idle',
	targetFolder: 'tree/openapi',
};

export default { ActionTypes, initialState };
