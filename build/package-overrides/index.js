/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-sync */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const overrideDefs = {
	// Needed until postcss supports browser environments + sanitise-html imports it
	postcss: {
		// parentPackage: 'none',
		moduleName: 'postcss',
		moduleOverridePath: 'lib/previous-map.js',
		file: 'previous-map.js',
	},
};

function main() {
	const wd = process.cwd();
	const overrideDir = path.join(wd, 'build', 'package-overrides', 'overrides');
	const overrides = Object.values(overrideDefs);

	overrides.forEach(override => {
		const fileContent = fs.readFileSync(path.join(overrideDir, override.file), 'utf8');
		let nodeModulesDirectory = path.join(wd, 'node_modules');

		if (override.parentPackage)
			nodeModulesDirectory = path.join(wd, 'packages', override.parentPackage, 'node_modules');

		const overrideFilePath = path.join(nodeModulesDirectory, override.moduleName, override.moduleOverridePath);

		fs.writeFileSync(overrideFilePath, fileContent);
	});
}

main();
