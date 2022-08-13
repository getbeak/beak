import ksuid from '@beak/ksuid';
import { BrowserWindow, dialog } from 'electron';

import persistentStore from './persistent-store';
import { projectIdWindowMapping } from './project';

export async function openReferenceFile(window: BrowserWindow) {
	const response = await dialog.showOpenDialog(window, {
		title: 'Open file',
		message: 'Select the file to open in Beak',
		properties: ['openFile', 'dontAddToRecent', 'showHiddenFiles'],
	});

	if (response.canceled)
		return null;

	const projectId = projectIdWindowMapping[window.id];
	const fileReferenceId = createReferenceFile(response.filePaths[0], projectId);

	return { fileReferenceId };
}

export async function previewReferencedFile(window: BrowserWindow, id: string) {
	const projectId = projectIdWindowMapping[window.id];

	return getReferenceFilePath(id, projectId);
}

function createReferenceFile(filePath: string, projectId: string) {
	const id = ksuid.generate('fileref').toString();
	const referenceFiles = persistentStore.get('referenceFiles');

	persistentStore.set('referenceFiles', {
		...referenceFiles,
		[projectId]: {
			...referenceFiles[projectId],
			[id]: filePath,
		},
	});

	return id;
}

function getReferenceFilePath(id: string, projectId: string) {
	const referenceFiles = persistentStore.get('referenceFiles');

	return referenceFiles?.[projectId]?.[id];
}
