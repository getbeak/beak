export type { ParsedExtensionManifest, ParseExtensionManifestOptions } from './manifest';
export { ExtensionManifests } from './manifest';
export { makeFullyQualifiedType, packageNameFromType, variableIdFromType } from './manifest-helpers';
export type { InstalledExtensionEntry, ProjectExtensionsManifest } from './project-extensions';
export { ProjectExtensions } from './project-extensions';
export type {
	ExtensionRegistryOptions,
	RegistryPackageMetadata,
	RegistrySearchHit,
	RegistryVersionMetadata,
	ResolvedVersion,
} from './registry';
export { default as ExtensionRegistry, packageDestination, verifyIntegrity } from './registry';
export type { RegisteredRecord, RegistryOptions } from './registry-base';
export { ProjectExtensionRegistry } from './registry-base';
export type { TarEntry } from './tar';
export { gunzip, readTar } from './tar';
export { WORKER_SOURCE, WORKER_RUNTIME_NODE_SHIM } from './worker-source';
export type {
	UnifiedWorker,
	WorkerExtensionManagerOptions,
	WorkerManagerCallbacks,
	WorkerProvider,
} from './worker-manager';
export { WorkerExtensionManager } from './worker-manager';
