import type { CollectionSource } from '@beak/state/schemas';
import { readOpenApiSource } from '@beak/ui/services/source-schemas/read-openapi-source';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import type { Tree } from '@getbeak/types/nodes';
import { FileText } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

type OpenApiSource = Extract<CollectionSource, { type: 'openapi' }>;

interface BannerProps {
	requestId: string;
}

/**
 * Renders above the request-pane header when the open request belongs to
 * an OpenAPI-synced collection. Mirrors `IntrospectionBanner` — same shape,
 * pink accent to match the openapi endpoint chip — so users instantly
 * recognise "this surface is regenerated, don't expect manual edits to
 * stick on re-sync."
 *
 * Walks the tree upward from the request to the nearest folder, reads its
 * `_collection.json`, and renders only if the source is openapi. Cheap:
 * the IPC call is gated on first paint and runs at most once per mount.
 */
const OpenApiSyncBanner: React.FC<BannerProps> = ({ requestId }) => {
	const tree = useAppSelector(s => s.global.project.tree);
	const [source, setSource] = useState<OpenApiSource | null>(null);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			const folderPath = findOwningFolderPath(tree, requestId);
			if (!folderPath) {
				if (!cancelled) setSource(null);
				return;
			}
			const next = await readOpenApiSource(folderPath);
			if (!cancelled) setSource(next);
		})();
		return () => {
			cancelled = true;
		};
	}, [tree, requestId]);

	if (!source) return null;

	const seedMode = source.seedMode ?? (source.specUrl ? 'url' : source.specPath ? 'file' : 'paste');
	const sourceLabel =
		seedMode === 'url'
			? (source.specUrl ?? 'a URL')
			: seedMode === 'file'
				? (source.specPath ?? 'a local file')
				: 'a pasted document';

	return (
		<Flex
			align='center'
			gap='2'
			px='3'
			py='1.5'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-accent-pink) 8%, var(--beak-colors-bg-surface))'
		>
			<Flex
				flexShrink={0}
				align='center'
				justify='center'
				w='18px'
				h='18px'
				borderRadius='sm'
				color='accent.pink'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
			>
				<FileText size={10} strokeWidth={2.2} />
			</Flex>
			<Box fontSize='11px' lineHeight='1.45' color='fg.muted'>
				<Box as='span' fontWeight='600' color='fg.default'>
					{'Generated from an OpenAPI spec'}
				</Box>
				{' — this request was created from '}
				<Box as='span' fontFamily='mono' color='fg.default'>
					{sourceLabel}
				</Box>
				{seedMode === 'url'
					? '. Re-syncing overwrites edits to the request body, URL, and headers. Customising auth or wrapping with variables is safe; the canonical fields get regenerated.'
					: seedMode === 'file'
						? '. Re-syncing from the file overwrites the generated fields. Customising auth or wrapping with variables is safe.'
						: '. The pasted spec isn’t kept around, so edits here stay — but if you re-import, this folder is overwritten.'}
			</Box>
		</Flex>
	);
};

function findOwningFolderPath(tree: Tree, requestId: string): string | null {
	const node = tree[requestId];
	if (!node) return null;
	let parentId: string | null = node.parent;
	while (parentId) {
		const parent = tree[parentId];
		if (!parent) return null;
		if (parent.type === 'folder') return parent.filePath;
		parentId = parent.parent;
	}
	return null;
}

export default OpenApiSyncBanner;
