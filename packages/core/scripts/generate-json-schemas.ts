/**
 * Generates JSON Schema documents from the zod schemas in @beak/core/schemas.
 *
 * Run via `yarn --cwd packages/core schemas:gen`. The output directory is
 * passed as the first argument (defaults to `./generated-schemas`).
 *
 * These JSON schemas are intended for publishing — e.g. uploading to
 * getbeak.app so VSCode can pick them up via `$schema` references inside
 * a project's preference files.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
	editorPreferencesSchema,
	projectFileSchema,
	projectPanePreferencesSchema,
	requestFileSchema,
	requestPreferenceSchema,
	sidebarPreferencesSchema,
	tabPreferencesSchema,
	toJsonSchema,
} from '../src/schemas';

const targets = {
	'editor-preferences': editorPreferencesSchema,
	'project-pane-preferences': projectPanePreferencesSchema,
	'project-file': projectFileSchema,
	'request-file': requestFileSchema,
	'request-preference': requestPreferenceSchema,
	'sidebar-preferences': sidebarPreferencesSchema,
	'tab-preferences': tabPreferencesSchema,
};

const outDir = resolve(process.cwd(), process.argv[2] ?? './generated-schemas');
mkdirSync(outDir, { recursive: true });

for (const [name, schema] of Object.entries(targets)) {
	const file = resolve(outDir, `${name}.json`);
	const json = toJsonSchema(schema, { name, $refStrategy: 'none' });
	writeFileSync(file, `${JSON.stringify(json, null, '\t')}\n`, 'utf-8');
	// eslint-disable-next-line no-console
	console.log(`wrote ${file}`);
}
