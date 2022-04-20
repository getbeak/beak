import React, { MutableRefObject } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import useChildNodes from '../../hooks/use-child-nodes';
import { TreeViewFolder } from '../../types';
import NodeItem from '../molecules/NodeItem';
import NodeName from '../molecules/NodeName';
import Node from './Node';

interface FolderNodeProps {
	depth: number;
	item: TreeViewFolder;
	parentElement?: MutableRefObject<HTMLElement | null>;
}

const FolderNode: React.FunctionComponent<FolderNodeProps> = props => {
	const { depth, item } = props;
	const collapsed = useSelector(s => s.global.preferences.projectPane.collapsed[item.id]);
	const { folderNodes, nodes } = useChildNodes(item.filePath);

	return (
		<FolderWrapper>
			<NodeItem id={item.id} collapsed={collapsed} collapsible depth={depth}>
				<NodeName
					collapsed={collapsed}
					collapsible
					name={item.name}
				/>
			</NodeItem>
			<FolderChildren>
				{!collapsed && folderNodes.map(n => (
					<FolderNode
						depth={depth + 1}
						item={n}
						// parentElement={}
					/>
				))}
				{!collapsed && nodes.map(n => (
					<Node
						depth={depth + 1}
						item={n}
						// parentElement={}
					/>
				))}
			</FolderChildren>
		</FolderWrapper>
	);
};

const FolderWrapper = styled.div``;
const FolderChildren = styled.div``;

export default FolderNode;
