import ksuid from '@beak/ksuid';
import { BrowserWindow, dialog } from 'electron';

import getBeakHost from '../host';
import { windowIdToProjectIdMapping } from '../window-management';

export async function openReferenceFile(window: BrowserWindow) {
	const response = await dialog.showOpenDialog(window, {
		title: 'Open file',
		message: 'Select the file to open in Beak',
		properties: ['openFile', 'dontAddToRecent', 'showHiddenFiles'],
	});

	if (response.canceled)
		return null;

	const projectId = windowIdToProjectIdMapping[window.id];
	const fileReferenceId = await createReferenceFile(response.filePaths[0], projectId);

	return { fileReferenceId };
}

export async function previewReferencedFile(window: BrowserWindow, id: string) {
	const projectId = windowIdToProjectIdMapping[window.id];

	return await getReferenceFilePath(id, projectId);
}

async function createReferenceFile(filePath: string, projectId: string) {
	const id = ksuid.generate('fileref').toString();
	const referenceFiles = await getBeakHost().providers.storage.get('referenceFiles');

	await getBeakHost().providers.storage.set('referenceFiles', {
		...referenceFiles,
		[projectId]: {
			...referenceFiles[projectId],
			[id]: filePath,
		},
	});

	return id;
}

async function getReferenceFilePath(id: string, projectId: string) {
	const referenceFiles = await getBeakHost().providers.storage.get('referenceFiles');

	return referenceFiles?.[projectId]?.[id];
}
