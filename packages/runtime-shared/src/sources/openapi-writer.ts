import type { CollectionFile, RequestFileOverride } from '@beak/state/schemas';

import { BeakBase, type Providers } from '../base';

export interface OpenApiSyncInput {
	collection: CollectionFile;
	requests: Array<{ suggestedName: string; override: RequestFileOverride }>;
}

export interface OpenApiSyncResult {
	collectionPath: string;
	requestPaths: string[];
	overwritten: string[];
	skipped: Array<{ path: string; reason: string }>;
}

/**
 * Persist the output of `openapiToCollection` into a folder under the
 * project's `tree/`. Writes `_collection.json` and one `.json` per request
 * override. Filenames come from `suggestedName`, sanitised and de-duplicated
 * against the target folder.
 *
 * Operates through the runtime's `Providers.node.fs` so it works in both the
 * Electron host (native fs) and the web host (lightning-fs). All paths are
 * absolute; callers are responsible for joining the project root.
 */
export default class OpenApiWriter extends BeakBase {
	constructor(providers: Providers) {
		super(providers);
	}

	async syncToFolder(targetFolderPath: string, input: OpenApiSyncInput): Promise<OpenApiSyncResult> {
		const path = this.p.node.path;
		const fs = this.p.node.fs.promises;

		await fs.mkdir(targetFolderPath, { recursive: true });

		const collectionPath = path.join(targetFolderPath, '_collection.json');
		const collectionExisted = await this.exists(collectionPath);
		await fs.writeFile(collectionPath, this.toJson(input.collection), { encoding: 'utf8' });

		const result: OpenApiSyncResult = {
			collectionPath,
			requestPaths: [],
			overwritten: collectionExisted ? [collectionPath] : [],
			skipped: [],
		};

		const used = new Set<string>(['_collection']);

		for (const r of input.requests) {
			const baseName = sanitiseFilename(r.suggestedName);
			if (!baseName) {
				result.skipped.push({
					path: r.suggestedName,
					reason: 'suggestedName produced an empty filename after sanitisation',
				});
				continue;
			}

			const filename = dedupe(baseName, used);
			used.add(filename);

			const requestPath = path.join(targetFolderPath, `${filename}.json`);
			const existed = await this.exists(requestPath);
			await fs.writeFile(requestPath, this.toJson(r.override), { encoding: 'utf8' });

			result.requestPaths.push(requestPath);
			if (existed) result.overwritten.push(requestPath);
		}

		return result;
	}

	private toJson(value: unknown): string {
		return `${JSON.stringify(value, null, '\t')}\n`;
	}

	private async exists(filePath: string): Promise<boolean> {
		try {
			await this.p.node.fs.promises.stat(filePath);
			return true;
		} catch {
			return false;
		}
	}
}

/**
 * Make `suggestedName` safe for a filesystem filename. Strips characters that
 * commonly cause trouble on Windows/macOS/Linux (`/`, `\`, `:`, `*`, `?`,
 * `"`, `<`, `>`, `|`), collapses repeats, and trims leading/trailing dots.
 */
export function sanitiseFilename(name: string): string {
	return name
		.replace(/[\\/:*?"<>|]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^[.\-]+|[.\-]+$/g, '')
		.slice(0, 120);
}

function dedupe(base: string, used: Set<string>): string {
	if (!used.has(base)) return base;
	let i = 2;
	while (used.has(`${base}-${i}`)) i++;
	return `${base}-${i}`;
}
