import getBeakHost from '../host';

export function platformNormalizePath(filePath: string) {
	return filePath.replace(/\\/g, '/');
}

export async function fileOrFolderExists(filePath: string): Promise<boolean> {
	try {
		await getBeakHost().p.node.fs.promises.stat(filePath);

		return true;
	} catch (error) {
		if (error instanceof Error) {
			if ('code' in error && typeof error.code === 'string' && ['ENOENT', 'ENOTDIR'].includes(error.code))
				return false;
		}

		throw error;
	}
}
