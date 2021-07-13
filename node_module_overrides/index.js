/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-sync */
const fs = require('fs');
const path = require('path');
const process = require('process');

const overrideDefs = {
	// Needed until fix for this issue is published to NPM
	// https://github.com/electron-userland/electron-builder/issues/4299
	'app-builder-lib': {
		parentPackage: 'electron-host',
		moduleName: 'app-builder-lib',
		moduleOverridePath: 'out/targets/ArchiveTarget.js',
		file: 'ArchiveTarget',
	},
};

function main() {
	const wd = process.cwd();
	const overrideDir = path.join(wd, 'node_module_overrides', 'overrides');
	const overrides = Object.values(overrideDefs);

	overrides.forEach(override => {
		const fileContent = fs.readFileSync(path.join(overrideDir, override.file), 'utf8');
		const nodeModulesDirectory = path.join(wd, 'packages', override.parentPackage, 'node_modules');
		const overrideFilePath = path.join(nodeModulesDirectory, override.moduleName, override.moduleOverridePath);

		fs.writeFileSync(overrideFilePath, fileContent);
	});
}

main();
