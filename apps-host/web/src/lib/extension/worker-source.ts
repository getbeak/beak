/**
 * Source for the per-extension Web Worker. Built into a Blob URL at
 * `WebExtensionManager.load`-time so each extension gets a fresh worker.
 *
 * Protocol (worker side):
 *  - in:  `{ kind: 'init', userSource: string, packageName: string }`
 *  - out: `{ kind: 'init-ok', metadata: ExtensionVariable[] }` |
 *         `{ kind: 'init-error', error: { code, info } }`
 *  - in:  `{ kind: 'call', callId, path: string[], args: unknown[] }`
 *  - out: `{ kind: 'result', callId, value }` | `{ kind: 'error', callId, error }`
 *  - out: `{ kind: 'parse-value-sections', requestId, ctx, parts }`
 *  - in:  `{ kind: 'parse-value-sections-result', requestId, parsed }` |
 *         `{ kind: 'parse-value-sections-error', requestId, error }`
 *
 * The worker has no DOM, no access to Beak's React state, and no
 * reference to the main thread's globals. It can still issue `fetch()`
 * and read IndexedDB on Beak's origin — that's the documented v1
 * trust model.
 */
export const WORKER_SOURCE = `
'use strict';

let pendingPVS = new Map();
let extCtx = null;
let registry = null; // variableId -> wrapped handles

function newRequestId() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const ALLOWED_LOG_LEVELS = new Set(['info', 'warn', 'error']);

function makeExtCtx(packageName) {
	return {
		log: (level, message) => {
			try {
				const normalised = ALLOWED_LOG_LEVELS.has(level) ? level : 'warn';
				postMessage({ kind: 'log', packageName, level: normalised, message: String(message) });
			} catch (e) {}
		},
		parseValueSections: (varCtx, parts) => new Promise((resolve, reject) => {
			const requestId = newRequestId();
			pendingPVS.set(requestId, { resolve, reject });
			postMessage({ kind: 'parse-value-sections', requestId, ctx: varCtx, parts });
		}),
	};
}

function validateAndBindExtension(raw, packageName) {
	if (!raw || typeof raw !== 'object')
		throw beakError('extension_invalid_export', 'Extension did not export a definition. Did you forget to export default defineExtension(...)?');

	if (raw.apiVersion !== 2)
		throw beakError('extension_unsupported_api_version', 'Extension declared an unsupported apiVersion: ' + raw.apiVersion);

	if (!Array.isArray(raw.variables) || raw.variables.length === 0)
		throw beakError('extension_no_variables', 'Extension does not contribute any variables.');

	const metadata = [];
	const handles = {};

	for (const variable of raw.variables) {
		if (typeof variable.id !== 'string' || variable.id.length === 0)
			throw beakError('extension_variable_missing_id', 'A contributed variable is missing its id.');
		if (typeof variable.name !== 'string')
			throw beakError('extension_variable_missing_name', 'Variable ' + variable.id + ' is missing a name.');
		if (typeof variable.description !== 'string')
			throw beakError('extension_variable_missing_description', 'Variable ' + variable.id + ' is missing a description.');
		if (typeof variable.createDefaultPayload !== 'function')
			throw beakError('extension_variable_missing_method', 'Variable ' + variable.id + ' is missing createDefaultPayload.');
		if (typeof variable.resolve !== 'function')
			throw beakError('extension_variable_missing_method', 'Variable ' + variable.id + ' is missing resolve.');

		const editor = variable.editor && typeof variable.editor === 'object'
			? {
				createUserInterface: typeof variable.editor.createUserInterface === 'function' ? variable.editor.createUserInterface : null,
				load: typeof variable.editor.load === 'function' ? variable.editor.load : null,
				save: typeof variable.editor.save === 'function' ? variable.editor.save : null,
			}
			: null;

		if (editor && !editor.createUserInterface)
			throw beakError('extension_editor_incomplete', 'Variable ' + variable.id + ' has an editor without createUserInterface.');

		metadata.push({
			variableId: variable.id,
			name: variable.name,
			description: variable.description,
			sensitive: Boolean(variable.sensitive),
			keywords: Array.isArray(variable.keywords) ? variable.keywords.slice() : [],
			attributes: variable.attributes && typeof variable.attributes === 'object'
				? { requiresRequestId: Boolean(variable.attributes.requiresRequestId) }
				: { requiresRequestId: false },
			editable: Boolean(editor),
		});

		handles[variable.id] = {
			createDefaultPayload: (varCtx) => variable.createDefaultPayload(extCtx, varCtx),
			resolve: (rctx, payload) => variable.resolve(extCtx, rctx, payload),
			editor: editor
				? {
					createUserInterface: (varCtx) => editor.createUserInterface(extCtx, varCtx),
					load: editor.load ? (varCtx, payload) => editor.load(extCtx, varCtx, payload) : null,
					save: editor.save ? (varCtx, existing, state) => editor.save(extCtx, varCtx, existing, state) : null,
				}
				: null,
		};
	}

	return { metadata, handles };
}

function evaluateUserSource(userSource) {
	const module = { exports: {} };
	const exports = module.exports;
	const fn = new Function('module', 'exports', userSource);
	fn(module, exports);
	return module.exports && (module.exports.default !== undefined ? module.exports.default : module.exports);
}

function beakError(code, message, info) {
	const error = new Error(message);
	error.code = code;
	if (info) error.info = info;
	return error;
}

function serialiseError(error) {
	if (!error) return { code: 'unknown', message: 'unknown error' };
	return {
		code: error.code || 'extension_runtime_error',
		message: error.message || String(error),
		info: error.info,
	};
}

async function resolveCall(path, args) {
	if (!registry) throw beakError('extension_not_initialised', 'extension worker has not finished init');

	const [variableId, ...rest] = path;
	const variable = registry[variableId];
	if (!variable) throw beakError('extension_unknown_variable', 'Unknown variable: ' + variableId);

	if (rest.length === 1) {
		const method = variable[rest[0]];
		if (typeof method !== 'function') throw beakError('extension_unknown_method', 'Unknown method: ' + path.join('.'));
		return await method.apply(null, args);
	}

	if (rest.length === 2 && rest[0] === 'editor') {
		if (!variable.editor) throw beakError('extension_editor_missing', 'Variable does not declare an editor');
		const method = variable.editor[rest[1]];
		if (typeof method !== 'function') throw beakError('extension_unknown_method', 'Unknown editor method: ' + path.join('.'));
		return await method.apply(null, args);
	}

	throw beakError('extension_invalid_call_path', 'Invalid call path: ' + path.join('.'));
}

self.addEventListener('message', async event => {
	const message = event.data;

	if (message.kind === 'init') {
		try {
			extCtx = makeExtCtx(message.packageName);
			const definition = evaluateUserSource(message.userSource);
			const bound = validateAndBindExtension(definition, message.packageName);
			registry = bound.handles;
			postMessage({ kind: 'init-ok', metadata: bound.metadata });
		} catch (error) {
			postMessage({ kind: 'init-error', error: serialiseError(error) });
		}
		return;
	}

	if (message.kind === 'call') {
		try {
			const value = await resolveCall(message.path, message.args);
			postMessage({ kind: 'result', callId: message.callId, value });
		} catch (error) {
			postMessage({ kind: 'error', callId: message.callId, error: serialiseError(error) });
		}
		return;
	}

	if (message.kind === 'parse-value-sections-result') {
		const entry = pendingPVS.get(message.requestId);
		if (!entry) return;
		pendingPVS.delete(message.requestId);
		entry.resolve(message.parsed);
		return;
	}

	if (message.kind === 'parse-value-sections-error') {
		const entry = pendingPVS.get(message.requestId);
		if (!entry) return;
		pendingPVS.delete(message.requestId);
		entry.reject(new Error(message.error?.message ?? 'parseValueSections failed'));
		return;
	}
});
`;
