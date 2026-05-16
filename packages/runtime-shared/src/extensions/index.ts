export { ExtensionManifests } from './manifest';
export type { ParsedExtensionManifest, ParseExtensionManifestOptions } from './manifest';
export { default as ExtensionRegistry, packageDestination, verifyIntegrity } from './registry';
export type {
	ExtensionRegistryOptions,
	RegistryPackageMetadata,
	RegistrySearchHit,
	RegistryVersionMetadata,
	ResolvedVersion,
} from './registry';
export { gunzip, readTar } from './tar';
export type { TarEntry } from './tar';
