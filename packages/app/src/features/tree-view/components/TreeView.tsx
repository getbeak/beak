import React, { useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TypedObject } from '@beak/common/helpers/typescript';
import { PayloadAction } from '@reduxjs/toolkit';
import type { MenuItemConstructorOptions } from 'electron';
import styled from 'styled-components';

import useSectionBody from '../../sidebar/hooks/use-section-body';
import { TreeViewAbstractionsContext } from '../contexts/abstractions-context';
import { TreeViewFocusContext } from '../contexts/focus-context';
import { TreeViewNodesContext } from '../contexts/nodes-context';
import { TreeViewFolderNode, TreeViewItem, TreeViewNode, TreeViewNodes } from '../types';
import RootDropContainer from './molecules/RootDropContainer';
import FolderNode from './organisms/FolderNode';
import Node from './organisms/Node';

interface TreeViewProps {
	tree: TreeViewNodes;
	activeNodeId?: string;
	startingDepth?: number;
	onContextMenu?: (node: TreeViewItem) => MenuItemConstructorOptions[];
	onDrop?: (sourceNodeId: string, destinationNodeId: string) => PayloadAction<unknown>;
	onNodeClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
}

const TreeView: React.FunctionComponent<TreeViewProps> = props => {
	const { tree, startingDepth = 0 } = props;
	const container = useRef<HTMLDivElement>(null);
	const formattedNodes = TypedObject.values(tree)
		.filter(t => t.parent === 'tree')
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	// A tree view is probably inside a flex body, so let grooow
	useSectionBody({ flexGrow: 2 });

	return (
		<TreeViewNodesContext.Provider value={tree}>
			<TreeViewAbstractionsContext.Provider value={{
				onContextMenu: props.onContextMenu,
				onDrop: props.onDrop,
				onNodeClick: props.onNodeClick,
				onNodeDoubleClick: props.onNodeDoubleClick,
			}}>
				<TreeViewFocusContext.Provider value={{
					activeNodeId: props.activeNodeId,
				}}>
					<DndProvider backend={HTML5Backend}>
						{/* Add back root context menu wrapper */}
						<Container ref={container}>
							<RootDropContainer>
								{formattedNodes.filter(i => i.type === 'folder').map(i => (
									<FolderNode
										key={i.id}
										depth={startingDepth}
										node={i as TreeViewFolderNode}
									/>
								))}
								{formattedNodes.filter(i => i.type !== 'folder').map(i => (
									<Node
										key={i.id}
										depth={startingDepth}
										node={i as TreeViewNode}
									/>
								))}
							</RootDropContainer>
						</Container>
					</DndProvider>
				</TreeViewFocusContext.Provider>
			</TreeViewAbstractionsContext.Provider>
		</TreeViewNodesContext.Provider>
	);
};

const Container = styled.div`
	height: 100%;

	&:focus {
		outline: none;
	}
`;

export default TreeView;
