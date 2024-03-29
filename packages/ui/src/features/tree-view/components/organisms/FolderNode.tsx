import React, { MutableRefObject } from 'react';
import { toHexAlpha } from '@beak/design-system/utils';
import { useAppSelector } from '@beak/ui/store/redux';
import styled, { css } from 'styled-components';

import { useNodeDrop } from '../../hooks/drag-and-drop';
import useChildNodes from '../../hooks/use-child-nodes';
import { TreeViewFolderNode } from '../../types';
import NodeItem from '../molecules/NodeItem';
import NodeName from '../molecules/NodeName';
import Node from './Node';

interface FolderNodeProps {
	depth: number;
	node: TreeViewFolderNode;
	hierarchicalParentRef?: MutableRefObject<HTMLElement | null>;
}

const FolderNode: React.FC<React.PropsWithChildren<FolderNodeProps>> = props => {
	const { depth, node } = props;
	const collapsed = useAppSelector(s => s.global.preferences.projectPane.collapsed[node.id]);
	const { folderNodes, nodes } = useChildNodes(node.filePath);
	const [{ hovering, canDrop }, dropRef] = useNodeDrop(node);

	return (
		<FolderWrapper $dropAccepted={canDrop} $dropHovering={hovering} ref={dropRef}>
			<NodeItem node={node} collapsed={collapsed} collapsible depth={depth}>
				<NodeName node={node} collapsed={collapsed} collapsible />
			</NodeItem>
			<FolderChildren>
				{!collapsed && folderNodes.map(n => (
					<FolderNode key={n.id} depth={depth + 1} node={n} />
				))}
				{!collapsed && nodes.map(n => (
					<Node key={n.id} depth={depth + 1} node={n} />
				))}
			</FolderChildren>
		</FolderWrapper>
	);
};

interface FolderWrapperProps {
	$dropAccepted: boolean;
	$dropHovering: boolean;
}

const FolderWrapper = styled.div<FolderWrapperProps>`
	${p => p.$dropAccepted && p.$dropHovering && css`
		border-radius: 4px;
		background-color: ${toHexAlpha(p.theme.ui.primaryFill, 0.6)};
	`}
`;

const FolderChildren = styled.div``;

export default FolderNode;
