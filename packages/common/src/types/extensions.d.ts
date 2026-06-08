// biome-ignore lint/style/noRestrictedImports: type-only imports of the SDK contracts used in cross-process payloads.
import type { ApiVersion, VariableStaticInformation } from '@getbeak/extension-sdk';

/**
 * Metadata describing one variable an extension contributes. The renderer
 * uses this to register the variable with `VariableManager`; runtime calls
 * (createDefaultPayload, resolve, …) round-trip back over IPC into the
 * extension's isolate.
 */
export interface ExtensionVariable extends VariableStaticInformation {
	/** Stable id inside the extension (e.g. `timestamp`). */
	variableId: string;
	/** Fully-qualified type Beak uses internally (`external:<pkg>/<id>`). */
	type: string;
	/** True when an editor block was declared — surface "edit" UI. */
	editable: boolean;
}

/**
 * An extension that loaded successfully. Holds enough metadata to render
 * the management UI without re-hitting the host.
 */
export interface LoadedExtension {
	status: 'loaded';
	/** npm package name (`@scope/name` or `name`). */
	packageName: string;
	/** Resolved version from the package's `package.json`. */
	version: string;
	/** Display name (`beak.displayName` ?? `package.json#name`). */
	displayName: string;
	/** Description (`beak.description` ?? `package.json#description`). */
	description?: string;
	/** Author display string (`package.json#author`). */
	author?: string;
	/** Homepage or repository URL (`package.json#homepage` ?? `repository.url`). */
	homepage?: string;
	/** Absolute path to the extension's folder on disk. */
	filePath: string;
	/** Authoring API version the extension targets. */
	apiVersion: ApiVersion;
	/** Variables this extension contributes. */
	variables: ExtensionVariable[];
}

/**
 * An extension that failed to load. Captures enough state for the
 * "Unable to load extension" UI to be actionable.
 */
export interface FailedExtension {
	status: 'failed';
	/** Best-effort package name (the folder name when the manifest itself failed). */
	packageName: string;
	/** Path to whichever file was being parsed when loading failed. */
	filePath: string;
	error: import('../utils/squawk').default;
}

export type Extension = LoadedExtension | FailedExtension;

/**
 * Status of an in-flight management operation (install/update/remove).
 * Keyed by package name in the slice.
 */
export interface ExtensionOperation {
	kind: 'install' | 'update' | 'remove';
	/** Human-readable status, surfaced in the management UI. */
	status: 'pending' | 'fetching' | 'extracting' | 'registering' | 'done' | 'failed';
	/** Target version, when known (install/update). */
	version?: string;
	error?: import('../utils/squawk').default;
}

/**
 * Available newer version for an installed extension. Populated by the
 * background "check updates" call.
 */
export interface AvailableUpdate {
	packageName: string;
	currentVersion: string;
	latestVersion: string;
	publishedAt?: string;
}

/**
 * Search hit from the npm registry. Used by the install picker.
 */
export interface ExtensionSearchResult {
	packageName: string;
	displayName?: string;
	description?: string;
	version: string;
	author?: string;
	homepage?: string;
	publishedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Legacy alias                                                              */
/* -------------------------------------------------------------------------- */

/**
 * @deprecated Use `LoadedExtension`. Kept as a type alias for the
 *             renderer code that hasn't yet been migrated.
 */
export type VariableExtension = LoadedExtension;
