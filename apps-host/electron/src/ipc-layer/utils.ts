import { IpcEvent } from '@beak/common/ipc/ipc';
import path from 'path';

import { getProjectFilePathWindowMapping } from './fs-shared';

export function getProjectFolder(event: IpcEvent) {
	const projectFilePath = getProjectFilePathWindowMapping(event);

	return path.join(projectFilePath, '..');
}
