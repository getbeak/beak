import React, { ReactElement, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ApplicationState } from '@beak/app-beak/store';
import { TypedObject } from '@beak/shared-common/helpers/typescript';
import { PayloadAction } from '@reduxjs/toolkit';
import type { MenuItemConstructorOptions } from 'electron';
import styled from 'styled-components';

import useSectionBody from '../../sidebar/hooks/use-section-body';
import { TreeViewAbstractionsContext } from '../contexts/abstractions-context';
import { TreeViewFocusContext } from '../contexts/focus-context';
import { TreeViewNodesContext } from '../contexts/nodes-context';
import useFocusedNodeSetup from '../hooks/use-focused-node-setup';
import { TreeViewFolderNode, TreeViewItem, TreeViewNode, TreeViewNodes } from '../types';
import RootDropContainer from './molecules/RootDropContainer';
import FolderNode from './organisms/FolderNode';
import Node from './organisms/Node';

interface TreeViewProps {
	tree: TreeViewNodes;
	rootParentName: string;
	activeNodeId?: string;
	focusedNodeId?: string;

	nodeFlairRenderers?: {
		[k: string]: (node: TreeViewItem) => ReactElement;
	};

	renameSelector?: (node: TreeViewItem, state: ApplicationState) => unknown;
	onRenameStarted?: (node: TreeViewItem) => void;
	onRenameUpdated?: (node: TreeViewItem, name: string) => void;
	onRenameSubmitted?: (node: TreeViewItem) => void;
	onRenameEnded?: (node: TreeViewItem) => void;

	onContextMenu?: (node: TreeViewItem) => MenuItemConstructorOptions[];
	onDrop?: (sourceNodeId: string, destinationNodeId: string) => PayloadAction<unknown>;
	onNodeClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>, node: TreeViewItem) => void;
}

const TreeView: React.FC<React.PropsWithChildren<TreeViewProps>> = props => {
	const { tree, rootParentName } = props;
	const container = useRef<HTMLDivElement>(null);
	const [focusedNodeId, focusedNodeInvalidator, setFocusedNodeId] = useFocusedNodeSetup(props.focusedNodeId);
	const formattedNodes = TypedObject.values(tree)
		.filter(t => t.parent === rootParentName)
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	// A tree view is probably inside a flex body, so let grooow
	useSectionBody({ flexGrow: 2 });

	return (
		<TreeViewNodesContext.Provider value={tree}>
			<TreeViewAbstractionsContext.Provider value={{
				nodeFlairRenderers: props.nodeFlairRenderers,

				renameSelector: props.renameSelector,
				onRenameStarted: props.onRenameStarted,
				onRenameUpdated: props.onRenameUpdated,
				onRenameSubmitted: props.onRenameSubmitted,
				onRenameEnded: props.onRenameEnded,

				onContextMenu: props.onContextMenu,
				onDrop: props.onDrop,
				onNodeClick: props.onNodeClick,
				onNodeDoubleClick: props.onNodeDoubleClick,
				onNodeKeyDown: props.onNodeKeyDown,
			}}>
				<TreeViewFocusContext.Provider value={{
					rootRef: container,
					activeNodeId: props.activeNodeId,
					focusedNodeId,
					focusedNodeInvalidator,
					setFocusedNodeId,
				}}>
					<DndProvider backend={HTML5Backend}>
						{/* Add back root context menu wrapper */}
						<Container ref={container}>
							<RootDropContainer>
								{formattedNodes.filter(i => i.type === 'folder').map(i => (
									<FolderNode
										key={i.id}
										depth={0}
										node={i as TreeViewFolderNode}
									/>
								))}
								{formattedNodes.filter(i => i.type !== 'folder').map(i => (
									<Node
										key={i.id}
										depth={0}
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
