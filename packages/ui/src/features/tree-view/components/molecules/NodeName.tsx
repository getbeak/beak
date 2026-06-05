import { verbToColor } from '@beak/design-system/helpers';
import { provenance } from '@beak/state';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import {
	ArrowUpRight,
	FileText,
	Folder,
	FolderOpen,
	Link2,
	type LucideIcon,
	Table,
	Workflow as WorkflowIcon,
} from 'lucide-react';
import React from 'react';

import type { TreeViewItem } from '../../types';
import Chevron from '../atoms/Chevron';
import NodeRenamer from './NodeRenamer';

interface NodeNameProps {
	node: TreeViewItem;
	collapsed?: boolean;
	collapsible?: boolean;
}

function nonRequestIcon(node: TreeViewItem, collapsed: boolean): { Icon: LucideIcon; color: string } {
	if (node.type === 'folder') {
		return {
			Icon: collapsed ? Folder : FolderOpen,
			color: 'var(--beak-colors-fg-muted)',
		};
	}
	if (node.type === 'variable-set') {
		return { Icon: Table, color: 'var(--beak-colors-accent-teal)' };
	}
	if (node.type === 'workflow') {
		return { Icon: WorkflowIcon, color: 'var(--beak-colors-accent-indigo)' };
	}
	// fallback for non-verb file-like nodes (e.g. _collection, broken requests)
	return { Icon: FileText, color: 'var(--beak-colors-fg-subtle)' };
}

const NodeName: React.FC<React.PropsWithChildren<NodeNameProps>> = props => {
	const { collapsed, collapsible, node } = props;
	const isRequest = node.type === 'request';
	const requestNode = useAppSelector(s => (isRequest ? (s.global.project.tree[node.id] as ValidRequestNode) : null));
	const nonReq = nonRequestIcon(node, Boolean(collapsed));
	const verb = requestNode?.info?.verb;
	const isLinked = provenance.isLinked(requestNode?.info);
	const Icon = isLinked ? Link2 : ArrowUpRight;

	return (
		<React.Fragment>
			<Chevron $collapsible={Boolean(collapsible)} $collapsed={Boolean(collapsed)} />
			{isRequest && verb ? (
				<Box
					as='span'
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					mr='1'
					w='28px'
					flexShrink={0}
					title={`${verb.toUpperCase()}${isLinked ? ' — linked to schema source' : ''}`}
					aria-label={`${verb.toUpperCase()}${isLinked ? ', linked to schema source' : ''}`}
					style={{ color: verbToColor(verb) }}
				>
					<Icon size={12} strokeWidth={2} />
				</Box>
			) : (
				<Box
					as='span'
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					mr='1'
					w='28px'
					flexShrink={0}
					style={{ color: nonReq.color }}
				>
					<nonReq.Icon size={12} strokeWidth={1.6} />
				</Box>
			)}
			<NodeRenamer node={node} />
		</React.Fragment>
	);
};

export default NodeName;
