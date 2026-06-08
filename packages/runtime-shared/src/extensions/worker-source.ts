/**
 * Source for the per-extension worker — runs identically in browser Web
 * Workers and `node:worker_threads`. Built into a Blob URL (web) or eval'd
 * inline (Node) at load-time, so each extension gets a fresh worker.
 *
 * Cross-runtime contract:
 *  - The script assumes the Web Worker API surface: `self`, top-level
 *    `postMessage`, `self.addEventListener('message', ...)`.
 *  - Node's `worker_threads` doesn't expose those; the Electron adapter
 *    prepends the `WORKER_RUNTIME_NODE_SHIM` below before passing the
 *    source to `new Worker(..., { eval: true })`.
 *
 * Wire protocol:
 *  - in:  `{ kind: 'init', userSource: string, packageName: string }`
 *  - out: `{ kind: 'init-ok', metadata: ExtensionVariable[] }`
 *         `{ kind: 'init-error', error: { code, message, info } }`
 *  - in:  `{ kind: 'call', callId, path: string[], args: unknown[] }`
 *  - out: `{ kind: 'result', callId, value }`
 *         `{ kind: 'error', callId, error }`
 *  - out: `{ kind: 'parse-value-sections', requestId, ctx, parts }`
 *  - in:  `{ kind: 'parse-value-sections-result', requestId, parsed }`
 *         `{ kind: 'parse-value-sections-error', requestId, error }`
 *  - out: `{ kind: 'log', packageName, level, message }`
 *
 * Trust model: extensions are user-installed under a project's
 * `extensions/` folder. Worker isolation provides V8-level memory
 * separation but is not a defence against actively malicious code.
 * See ADR-0003 for the full rationale.
 */

/**
 * Aliases the Web Worker globals onto Node's `parentPort` so the shared
 * worker source can run unchanged under `node:worker_threads`. Also
 * installs `__beak_vm_evaluate` — a stricter evaluator that runs the
 * user's extension code in a `vm.createContext` sandbox with an
 * ECMAScript-only global. Prepended by the Electron WorkerProvider
 * before `new Worker(source, { eval: true })`.
 *
 * The sandbox restores the isolation guarantee the previous
 * `isolated-vm` implementation provided: no `process`, `Buffer`,
 * `require`, dynamic `import()`, `fetch`, `console`, `setTimeout`, or
 * any Node / Web platform API. Extensions get the language plus
 * `extCtx` (the host bridge passed in as an argument) — full stop.
 * See ADR-0003 §3 (Trust model).
 */
export const WORKER_RUNTIME_NODE_SHIM = `
const { parentPort } = require('node:worker_threads');
const vm = require('node:vm');

globalThis.self = globalThis;
globalThis.postMessage = parentPort.postMessage.bind(parentPort);
globalThis.addEventListener = (type, fn) => {
	if (type === 'message') parentPort.on('message', data => fn({ data }));
};

const sandboxGlobals = Object.create(null);

// Global values
sandboxGlobals.undefined = undefined;
sandboxGlobals.NaN = NaN;
sandboxGlobals.Infinity = Infinity;

// Global functions
sandboxGlobals.parseInt = parseInt;
sandboxGlobals.parseFloat = parseFloat;
sandboxGlobals.isNaN = isNaN;
sandboxGlobals.isFinite = isFinite;
sandboxGlobals.encodeURI = encodeURI;
sandboxGlobals.encodeURIComponent = encodeURIComponent;
sandboxGlobals.decodeURI = decodeURI;
sandboxGlobals.decodeURIComponent = decodeURIComponent;

// Fundamental objects + Function constructor (sandboxed: code it
// compiles inherits the same restricted globals via the vm context).
sandboxGlobals.Object = Object;
sandboxGlobals.Function = Function;
sandboxGlobals.Boolean = Boolean;
sandboxGlobals.Symbol = Symbol;

// Errors
sandboxGlobals.Error = Error;
sandboxGlobals.TypeError = TypeError;
sandboxGlobals.RangeError = RangeError;
sandboxGlobals.SyntaxError = SyntaxError;
sandboxGlobals.ReferenceError = ReferenceError;
sandboxGlobals.EvalError = EvalError;
sandboxGlobals.URIError = URIError;
sandboxGlobals.AggregateError = AggregateError;

// Numbers + math
sandboxGlobals.Number = Number;
sandboxGlobals.BigInt = BigInt;
sandboxGlobals.Math = Math;
sandboxGlobals.Date = Date;

// Text
sandboxGlobals.String = String;
sandboxGlobals.RegExp = RegExp;

// Collections
sandboxGlobals.Array = Array;
sandboxGlobals.Map = Map;
sandboxGlobals.Set = Set;
sandboxGlobals.WeakMap = WeakMap;
sandboxGlobals.WeakSet = WeakSet;

// Structured data
sandboxGlobals.JSON = JSON;
sandboxGlobals.ArrayBuffer = ArrayBuffer;
sandboxGlobals.DataView = DataView;
sandboxGlobals.Uint8Array = Uint8Array;
sandboxGlobals.Uint8ClampedArray = Uint8ClampedArray;
sandboxGlobals.Uint16Array = Uint16Array;
sandboxGlobals.Uint32Array = Uint32Array;
sandboxGlobals.Int8Array = Int8Array;
sandboxGlobals.Int16Array = Int16Array;
sandboxGlobals.Int32Array = Int32Array;
sandboxGlobals.Float32Array = Float32Array;
sandboxGlobals.Float64Array = Float64Array;
sandboxGlobals.BigInt64Array = BigInt64Array;
sandboxGlobals.BigUint64Array = BigUint64Array;

// Control abstractions
sandboxGlobals.Promise = Promise;

// Reflection
sandboxGlobals.Reflect = Reflect;
sandboxGlobals.Proxy = Proxy;

// Intl — locale-aware formatting; pure with no external state.
sandboxGlobals.Intl = Intl;

// Deliberately omitted (security): process, Buffer, require, globalThis-as-Node,
// dynamic import(), fetch, crypto, console, setTimeout/setInterval, URL,
// SharedArrayBuffer, Atomics, WebAssembly, eval (blocked via codeGeneration).

const sandboxContext = vm.createContext(sandboxGlobals, {
	name: 'beak-extension-sandbox',
	// Disallow Function/eval from generating code from strings inside
	// the sandbox. WASM is also off — extensions don't need it.
	codeGeneration: { strings: false, wasm: false },
});

globalThis.__beak_vm_evaluate = function (userSource) {
	const module = { exports: {} };
	sandboxGlobals.module = module;
	sandboxGlobals.exports = module.exports;
	try {
		vm.runInContext(
			'(function (module, exports) {' + userSource + '\\n})(module, exports);',
			sandboxContext,
			{ filename: 'beak-extension.js' },
		);
	} finally {
		delete sandboxGlobals.module;
		delete sandboxGlobals.exports;
	}
	return module.exports && (module.exports.default !== undefined ? module.exports.default : module.exports);
};
`;

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

	if (raw.apiVersion !== 1)
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
		if (typeof variable.getValue !== 'function')
			throw beakError('extension_variable_missing_method', 'Variable ' + variable.id + ' is missing getValue.');

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
			binary: typeof variable.getAssetRef === 'function',
		});

		handles[variable.id] = {
			createDefaultPayload: (varCtx) => variable.createDefaultPayload(extCtx, varCtx),
			getValue: (varCtx, payload, depth) => variable.getValue(extCtx, varCtx, payload, depth),
			getAssetRef: typeof variable.getAssetRef === 'function'
				? (varCtx, payload, depth) => variable.getAssetRef(extCtx, varCtx, payload, depth)
				: null,
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
	// In Node \`worker_threads\`, the runtime shim installs a vm-based
	// evaluator that runs the user's extension code with an
	// ECMAScript-only global (no Node APIs, no Web APIs). In a browser
	// Web Worker the shim is absent and we fall back to \`new Function\` —
	// the worker's globalThis still exposes Web APIs but cannot reach
	// Beak's main thread state. See ADR-0003 §3.
	if (typeof globalThis.__beak_vm_evaluate === 'function') {
		return globalThis.__beak_vm_evaluate(userSource);
	}
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
