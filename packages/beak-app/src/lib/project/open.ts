import { validate } from 'jsonschema';

import { projectSchema } from './schemas';

const fs = window.require('fs-extra');

export default async function openProject(projectPath: string) {
	const projectFile = await fs.readJSON(projectPath);
	const projectValRes = validate(projectFile, projectSchema, { throwError: true });
	
	console.log(projectFile);

	// Read project file
	// Create class (?)
	// Start listeners
	// Return class
}
