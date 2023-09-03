import { BeakBase } from '../base';

export async function fileExists(base: BeakBase, filePath: string): Promise < boolean > {
	try {
		await base.p.node.fs.promises.stat(filePath);

		return true;
	} catch (error) {
		if (error instanceof Error) {
			if ('code' in error && typeof error.code === 'string' && ['ENOENT', 'ENOTDIR'].includes(error.code))
				return false;
		}

		throw error;
	}
}
