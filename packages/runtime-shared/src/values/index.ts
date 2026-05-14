import { BeakBase } from '../base';

/**
 * Project-level store for request values. The file lives under
 * `<projectRoot>/.beak/values.json` (which is gitignored by default), so
 * day-to-day "I typed a new token" churn stays out of the project's git
 * history. The schema layer (`@beak/state/schemas/request-values`) defines
 * the on-disk shape (versioned, `requests: { [id]: RequestValues }`).
 *
 * Reads return a raw parsed JSON object so the renderer can re-validate
 * with Zod before trusting it; writes accept any JSON-serializable value
 * and write atomically via a tmp-rename. `null` from read = file absent.
 */

const RELATIVE_VALUES_PATH = ['.beak', 'values.json'] as const;

export default class ValueStore extends BeakBase {
	/** Read `.beak/values.json`. Returns `null` when the file is absent. */
	async read(projectRoot: string): Promise<unknown | null> {
		const fullPath = this.toAbsolute(projectRoot);
		if (!(await this.fileExists(fullPath))) return null;
		const raw = await this.p.node.fs.promises.readFile(fullPath, 'utf8');
		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	}

	/**
	 * Write `.beak/values.json`. Creates the `.beak/` directory if it's
	 * missing (older projects may not have it). Caller is responsible for
	 * supplying a value that conforms to `projectValuesFileSchema`.
	 */
	async write(projectRoot: string, value: unknown): Promise<void> {
		const dir = this.p.node.path.join(projectRoot, '.beak');
		await this.p.node.fs.promises.mkdir(dir, { recursive: true });

		const fullPath = this.toAbsolute(projectRoot);
		const serialized = `${JSON.stringify(value, null, '\t')}\n`;
		await this.p.node.fs.promises.writeFile(fullPath, serialized, 'utf8');
	}

	private toAbsolute(projectRoot: string): string {
		return this.p.node.path.join(projectRoot, ...RELATIVE_VALUES_PATH);
	}

	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await this.p.node.fs.promises.stat(filePath);
			return true;
		} catch {
			return false;
		}
	}
}
