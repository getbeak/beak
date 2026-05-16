// biome-ignore lint/suspicious/noExplicitAny: meta is intentionally untyped — domain errors carry arbitrary context.
type Meta = Record<string, any>;

/**
 * Beak's handled error type — a "domain error" carrying:
 *
 *   - `kind` / `code`  — a stable string discriminant safe for IPC, logging,
 *                        and equality checks (use instead of `instanceof`
 *                        across process boundaries).
 *   - `meta`           — arbitrary domain context (e.g. `{ filePath }`,
 *                        zod `fieldErrors`, etc).
 *   - `reasons`        — nested causes; native `Error`s are coerced to
 *                        `Squawk` with `kind: 'unknown'` so the chain is
 *                        always uniformly shaped.
 *   - `httpStatus`     — optional HTTP status hint for boundaries that
 *                        translate domain errors to responses.
 *
 * The class is exported as `Squawk` (legacy name) and `BeakError` (preferred).
 * Code may use either; they refer to the same class. The default export is
 * the class itself for `import Squawk from '@beak/squawk'` to keep working.
 *
 * Serialised shape (see `serialize()`):
 *   { kind, message, meta, httpStatus, reasons: [...] }
 *
 * Error.message is automatically built as a human-readable sentence
 * (`<kind>: <message?> {meta hint}`), so a vanilla `console.error(err)` is
 * useful without callers reaching into `meta` themselves.
 */
interface SquawkOptions {
	meta?: Meta;
	reasons?: readonly Error[];
	httpStatus?: number;
	/** Human-readable summary. Defaults to a sentence built from kind + meta. */
	message?: string;
}

export interface SerializedReason {
	kind: string;
	meta?: Meta;
	reasons?: SerializedReason[];
}

export interface SerializedSquawk {
	kind: string;
	message: string;
	meta: Meta;
	httpStatus?: number;
	reasons: SerializedReason[];
}

export default class Squawk extends Error {
	readonly isHandled = true as const;
	readonly code: string;
	readonly meta: Meta;
	// Not a `readonly` array so Redux Toolkit's Draft<> can absorb the type
	// when a Squawk lands inside slice state (e.g. project/alerts).
	readonly reasons: Squawk[];
	readonly httpStatus: number | undefined;

	constructor(code: string, meta?: Meta | null, reasons?: readonly Error[]);
	constructor(code: string, options: SquawkOptions);
	constructor(
		code: string,
		metaOrOptions?: Meta | SquawkOptions | null,
		legacyReasons?: readonly Error[],
	) {
		const opts = normaliseConstructorArgs(metaOrOptions, legacyReasons);
		const message = opts.message ?? buildMessage(code, opts.meta);
		super(message);

		this.code = code;
		this.meta = opts.meta ?? {};
		this.reasons = (opts.reasons ?? []).map(r => Squawk.coerce(r));
		this.httpStatus = opts.httpStatus;

		defineNonSerializable(this, 'name', this.constructor.name === 'Object' ? 'Squawk' : this.constructor.name);
	}

	/** Stable string discriminant — alias for `code`. */
	get kind(): string {
		return this.code;
	}

	/**
	 * Type-safe `instanceof` for subclasses. Same-process only.
	 *
	 * ```ts
	 * if (ValidationError.is(err)) err.meta.fieldErrors // narrowed
	 * ```
	 */
	static is<T extends Squawk>(this: abstract new (...args: never) => T, error: unknown): error is T {
		return error instanceof Squawk;
	}

	/** True when `error` is a known Squawk (any subclass). */
	static isHandled(error: unknown): error is Squawk {
		return error instanceof Squawk;
	}

	/** True when `error` is an unhandled infrastructure Error. */
	static isUnhandled(error: unknown): boolean {
		return error instanceof Error && !(error instanceof Squawk);
	}

	/** Legacy alias — `Squawk.isSquawk(err)`. */
	static isSquawk(error: unknown): error is Squawk {
		return Squawk.isHandled(error);
	}

	/**
	 * Coerce an arbitrary thrown value into a Squawk.
	 *
	 *   - already a Squawk         → returned as-is
	 *   - native Error             → wrapped with kind 'unknown', message preserved in meta
	 *   - plain object with `code` → reconstructed as Squawk(code, meta, reasons)
	 *   - anything else            → kind 'unknown' with the raw value in meta
	 */
	static coerce(error: unknown): Squawk {
		if (error instanceof Squawk) return error;

		if (error instanceof Error) {
			const wrapped = new Squawk('unknown', {
				meta: { message: error.message, name: error.name },
				message: error.message || 'Unknown error',
			});
			defineNonSerializable(wrapped, 'stack', error.stack);
			return wrapped;
		}

		if (error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string') {
			const e = error as { code: string; meta?: Meta; reasons?: Error[] };
			return new Squawk(e.code, { meta: e.meta, reasons: e.reasons });
		}

		return new Squawk('unknown', { meta: error ? { value: error } : undefined });
	}

	/**
	 * Return a user-safe message for any error.
	 *  - Squawk → `.message`
	 *  - other  → generic "An unknown error occurred", with the original passed
	 *             to `log` for telemetry.
	 */
	static toUserMessage(error: unknown, log?: (error: unknown) => void): string {
		if (error instanceof Squawk) return error.message;
		log?.(error);
		return 'An unknown error occurred';
	}

	/** JSON-serialisable shape — safe to send across IPC boundaries. */
	serialize(): SerializedSquawk {
		return {
			kind: this.code,
			message: this.message,
			meta: this.meta,
			httpStatus: this.httpStatus,
			reasons: this.reasons.map(serializeReason),
		};
	}

	toJSON(): SerializedSquawk {
		return this.serialize();
	}
}

/**
 * Thrown when input fails domain-level validation (HTTP 422 hint).
 *
 * `ValidationError.fromZodError(zodError, { filePath })` is the common path:
 * it flattens Zod's `issues` into `meta.fieldErrors` (`{ "path.to.field": "msg" }`)
 * and `meta.issues` (the raw array) so downstream UI can render either.
 */
export class ValidationError extends Squawk {
	declare readonly code: 'schema_invalid';

	constructor(message: string, options: { meta?: Meta; reasons?: readonly Error[] } = {}) {
		super('schema_invalid', {
			meta: options.meta,
			reasons: options.reasons,
			httpStatus: 422,
			message,
		});
	}

	static fromZodError(
		// Zod's exact `path` shape changed across versions (string|number vs
		// PropertyKey); accept the broadest signature and stringify each segment.
		zodError: { issues: ReadonlyArray<{ path?: ReadonlyArray<PropertyKey>; message: string; code?: string }> },
		extraMeta?: Meta,
	): ValidationError {
		const issues = zodError.issues ?? [];
		const fieldErrors: Record<string, string> = {};
		const formatPath = (path: ReadonlyArray<PropertyKey> | undefined) =>
			(path ?? []).map(String).join('.') || '(root)';

		for (const issue of issues) {
			fieldErrors[formatPath(issue.path)] = issue.message;
		}
		const summary =
			issues.length === 0
				? 'Validation failed'
				: issues.length === 1
					? `Validation failed at ${formatPath(issues[0].path)}: ${issues[0].message}`
					: `Validation failed (${issues.length} issues)`;

		return new ValidationError(summary, {
			meta: {
				...extraMeta,
				fieldErrors,
				issues,
			},
		});
	}
}

/** Thrown when a resource doesn't exist (HTTP 404). */
export class NotFoundError extends Squawk {
	constructor(resource: string, id: string, options: { meta?: Meta; reasons?: readonly Error[] } = {}) {
		super(`${resource}_not_found`, {
			meta: { id, ...options.meta },
			reasons: options.reasons,
			httpStatus: 404,
			message: `${resource} not found: ${id}`,
		});
	}
}

/** Preferred alias for code that doesn't want the legacy `Squawk` name. */
export const BeakError = Squawk;
export type BeakError = Squawk;

// ─── internals ───────────────────────────────────────────────────────────────

function normaliseConstructorArgs(
	metaOrOptions: Meta | SquawkOptions | null | undefined,
	legacyReasons: readonly Error[] | undefined,
): SquawkOptions {
	if (metaOrOptions === null || metaOrOptions === undefined) {
		return { reasons: legacyReasons };
	}
	const keys = Object.keys(metaOrOptions);
	const looksLikeOptions =
		keys.length > 0 &&
		keys.every(k => k === 'meta' || k === 'reasons' || k === 'httpStatus' || k === 'message');
	if (looksLikeOptions) {
		return metaOrOptions as SquawkOptions;
	}
	return { meta: metaOrOptions as Meta, reasons: legacyReasons };
}

function buildMessage(code: string, meta: Meta | undefined): string {
	if (!meta) return code;
	if (typeof meta.message === 'string') return `${code}: ${meta.message}`;
	if (typeof meta.filePath === 'string') return `${code} at ${meta.filePath}`;
	if (typeof meta.id === 'string') return `${code} (${meta.id})`;
	return code;
}

function serializeReason(error: Squawk): SerializedReason {
	return {
		kind: error.code,
		...(Object.keys(error.meta).length > 0 && { meta: error.meta }),
		...(error.reasons.length > 0 && { reasons: error.reasons.map(serializeReason) }),
	};
}

function defineNonSerializable(obj: unknown, property: string, value: unknown) {
	Object.defineProperty(obj, property, {
		value,
		writable: false,
		enumerable: false,
		configurable: true,
	});
}
