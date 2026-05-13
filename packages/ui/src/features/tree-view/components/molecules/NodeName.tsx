import { Box } from '@chakra-ui/react';
import { FileText, Folder, FolderOpen, type LucideIcon, Table } from 'lucide-react';
import React from 'react';

import type { TreeViewItem } from '../../types';
import Chevron from '../atoms/Chevron';
import NodeRenamer from './NodeRenamer';

interface NodeNameProps {
	node: TreeViewItem;
	collapsed?: boolean;
	collapsible?: boolean;
}

function iconForNode(node: TreeViewItem, collapsed: boolean): { Icon: LucideIcon; color: string } {
	if (node.type === 'folder') {
		return {
			Icon: collapsed ? Folder : FolderOpen,
			color: 'var(--beak-colors-accent-pink)',
		};
	}
	if (node.type === 'variable-set') {
		return { Icon: Table, color: 'var(--beak-colors-accent-teal)' };
	}
	// request, or anything else default
	return { Icon: FileText, color: 'var(--beak-colors-fg-subtle)' };
}

const NodeName: React.FC<React.PropsWithChildren<NodeNameProps>> = props => {
	const { collapsed, collapsible, node } = props;
	const { Icon, color } = iconForNode(node, Boolean(collapsed));

	return (
		<React.Fragment>
			<Chevron $collapsible={Boolean(collapsible)} $collapsed={Boolean(collapsed)} />
			<Box
				as='span'
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				mr='1.5'
				w='12px'
				h='12px'
				flexShrink={0}
				style={{ color }}
			>
				<Icon size={11} />
			</Box>
			<NodeRenamer node={node} />
		</React.Fragment>
	);
};

export default NodeName;
