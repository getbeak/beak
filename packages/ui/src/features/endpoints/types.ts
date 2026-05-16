import type { CollectionFile, CollectionSource } from '@beak/state/schemas';

/**
 * Discriminator for the endpoint feature — graphql vs grpc. They share the
 * same UX surface (sidebar list, dialog, persistence pattern), so the rest
 * of the feature is parameterised over this single tag.
 */
export type EndpointKind = 'graphql' | 'grpc';

export type GraphqlSource = Extract<CollectionSource, { type: 'graphql' }>;
export type GrpcSource = Extract<CollectionSource, { type: 'grpc' }>;
export type EndpointSource = GraphqlSource | GrpcSource;

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
	/** Placeholder hint for the endpoint URL field. */
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
};
