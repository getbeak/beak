import { IpcEvent } from '@beak/common/ipc/ipc';
import path from 'path';

import { getProjectWindowMapping } from './fs-shared';

export function getProjectFolder(event: IpcEvent) {
	const projectFilePath = getProjectWindowMapping(event);

	return path.join(projectFilePath, '..');
}
