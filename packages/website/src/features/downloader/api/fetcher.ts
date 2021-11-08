import { load } from 'js-yaml';

export interface Downloads {
	windows: Update | null;
	macOS: Update | null;
	linux: Update | null;
}

interface Update {
	version: string;
	files: {
		url: string;
		sha512: string;
		size: number;
		blockMapSize: number;
	}[];
	path: string;
	downloadPath: string;
	sha512: string;
	releaseDate: string;
}

const updateChannel = 'latest';

export const buildsRepoBaseUrl = 'https://builds.getbeak.app';

export default async function downloadsFetcher() {
	const [windows, macOS, linux] = await Promise.all([
		fetchPlatform('windows', true),
		fetchPlatform('macOS', true),
		fetchPlatform('linux', true),
	]);

	return { windows, macOS, linux };
}

async function fetchPlatform(platform: keyof Downloads, throwError?: boolean) {
	try {
		const squirrelKey = platformToSquirrelKey(platform);
		const updateFileBasename = [updateChannel, squirrelKey].filter(Boolean).join('-');

		const response = await fetch(`${buildsRepoBaseUrl}/${updateFileBasename}.yml`);
		const text = await response.text();
		const parsedYml = load(text) as Update;

		parsedYml.downloadPath = `${buildsRepoBaseUrl}/${parsedYml.path}`;

		return parsedYml;
	} catch (error) {
		if (throwError)
			throw error;
			// throw Squawk.coerce(error);

		return null;
	}
}

function platformToSquirrelKey(platform: keyof Downloads) {
	switch (platform) {
		case 'linux':
			return 'linux';

		case 'macOS':
			return 'mac';

		default:
			return '';
	}
}
