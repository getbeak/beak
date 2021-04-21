const { remote } = window.require('electron');
const fs = remote.require('fs-extra');
const path = remote.require('path');

export async function generateSafeNewPath(name: string, directory: string, extension?: string) {
	function createPath(name: string) {
		return path.join(directory, `${name}${extension}`);
	}

	if (!await fs.pathExists(createPath(name)))
		return { name: `${name}${extension}`, fullPath: createPath(name) };

	let useableName = name;
	let index = 1;

	const matches = (/^(.+) {1}\(([0-9]+)\)$/gm).exec(useableName);

	if (matches && matches.length === 3) {
		useableName = matches[1];
		index = Number(matches[2]) + 1;
	}

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const full = createPath(`${useableName} (${index})`);

		// eslint-disable-next-line no-await-in-loop
		if (!await fs.pathExists(full)) {
			return {
				name: `${useableName} (${index})${extension}`,
				fullPath: full,
			};
		}

		index += 1;
	}
}
