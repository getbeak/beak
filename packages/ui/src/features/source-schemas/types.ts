import type { CollectionFile, CollectionSource } from '@beak/state/schemas';

/**
 * Discriminator for the endpoint feature — graphql, grpc, and openapi all
 * describe a schema-driven request generator that groups requests under a
 * single folder. They share the same UX surface (sidebar list, dialog,
 * persistence pattern), so the rest of the feature is parameterised over
 * this single tag.
 */
export type EndpointKind = 'graphql' | 'grpc' | 'openapi';

export type GraphqlSource = Extract<CollectionSource, { type: 'graphql' }>;
export type GrpcSource = Extract<CollectionSource, { type: 'grpc' }>;
export type OpenApiSource = Extract<CollectionSource, { type: 'openapi' }>;
export type EndpointSource = GraphqlSource | GrpcSource | OpenApiSource;

export interface EndpointEntry<S extends EndpointSource = EndpointSource> {
	folderPath: string;
	relativeFolder: string;
	folderName: string;
	collection: CollectionFile;
	source: S;
}

export interface EndpointKindConfig {
	kind: EndpointKind;
	/** Display label (singular). */
	label: string;
	/** Display label (plural). */
	pluralLabel: string;
	/** Short explanation shown in the empty state. */
	tagline: string;
	/** CSS variable for the accent — picks up theme tokens. */
	accentVar: string;
	/** Chakra colour token for the accent. */
	accentToken: string;
	/**
	 * Placeholder hint for the endpoint URL field. Only meaningful for
	 * kinds whose dialog asks for a single endpoint URL (graphql, grpc);
	 * openapi has its own three-mode form and ignores this.
	 */
	endpointPlaceholder: string;
}

export const ENDPOINT_CONFIG: Record<EndpointKind, EndpointKindConfig> = {
	graphql: {
		kind: 'graphql',
		label: 'GraphQL endpoint',
		pluralLabel: 'GraphQL endpoints',
		tagline:
			'Register a GraphQL endpoint and group every request that targets it under a single folder. Headers, auth, and the schema can ride along once they’re wired up.',
		accentVar: 'var(--beak-colors-accent-indigo)',
		accentToken: 'accent.indigo',
		endpointPlaceholder: 'https://api.example.com/graphql',
	},
	grpc: {
		kind: 'grpc',
		label: 'gRPC service',
		pluralLabel: 'gRPC services',
		tagline:
			'Register a gRPC service so requests authored under its folder can pick methods from a `.proto` descriptor (coming in the next phase).',
		accentVar: 'var(--beak-colors-accent-teal)',
		accentToken: 'accent.teal',
		endpointPlaceholder: 'grpc.example.com:50051',
	},
	openapi: {
		kind: 'openapi',
		label: 'OpenAPI spec',
		pluralLabel: 'OpenAPI specs',
		tagline:
			'Generate a folder of requests from an OpenAPI 3.x spec — point at a file, a URL, or paste the text. URL sources can keep syncing in the background; edits to the generated requests get overwritten on re-sync.',
		accentVar: 'var(--beak-colors-accent-pink)',
		accentToken: 'accent.pink',
		endpointPlaceholder: '',
	},
};
