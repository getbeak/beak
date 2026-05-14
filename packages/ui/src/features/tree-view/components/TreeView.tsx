import { Box } from '@chakra-ui/react';
import type { ApplicationState } from '@beak/ui/store';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MenuItemConstructorOptions } from 'electron';
import React from 'react';
import { type ReactElement, useCallback, useMemo, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { LayoutGroup } from 'framer-motion';

import useSectionBody from '../../sidebar/hooks/use-section-body';
import { TreeViewAbstractionsContext } from '../contexts/abstractions-context';
import { TreeViewFlatContext } from '../contexts/flat-context';
import { TreeViewFocusContext } from '../contexts/focus-context';
import { TreeViewNodesContext } from '../contexts/nodes-context';
import useFlattenedTree from '../hooks/use-flattened-tree';
import useFocusedNodeSetup from '../hooks/use-focused-node-setup';
import type { TreeViewFolderNode, TreeViewItem, TreeViewNode, TreeViewNodes } from '../types';
import NodeContextMenu from './molecules/NodeContextMenu';
import RootDropContainer from './molecules/RootDropContainer';
import FolderNode from './organisms/FolderNode';
import Node from './organisms/Node';

interface TreeViewProps {
	tree: TreeViewNodes;
	rootParentName: string;
	activeNodeId?: string;
	focusedNodeId?: string;
	allowRootContextMenu?: boolean;

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

const ROW_HEIGHT = 24;
const OVERSCAN = 12;

const TreeView: React.FC<React.PropsWithChildren<TreeViewProps>> = props => {
	const { tree, rootParentName, allowRootContextMenu } = props;
	const container = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [focusedNodeId, focusedNodeInvalidator, setFocusedNodeId] = useFocusedNodeSetup(props.focusedNodeId);
	const { flat, indexById } = useFlattenedTree(tree, rootParentName);

	const virtualizer = useVirtualizer({
		count: flat.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: OVERSCAN,
		getItemKey: index => flat[index]?.id ?? index,
	});

	const scrollToIndex = useCallback(
		(index: number) => {
			virtualizer.scrollToIndex(index, { align: 'auto' });
		},
		[virtualizer],
	);

	const flatContextValue = useMemo(
		() => ({ flat, indexById, scrollToIndex }),
		[flat, indexById, scrollToIndex],
	);

	useSectionBody({ flexGrow: 2 });

	const virtualItems = virtualizer.getVirtualItems();

	return (
		<TreeViewNodesContext.Provider value={tree}>
			<TreeViewAbstractionsContext.Provider
				value={{
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
				}}
			>
				<TreeViewFocusContext.Provider
					value={{
						rootRef: container,
						activeNodeId: props.activeNodeId,
						focusedNodeId,
						focusedNodeInvalidator,
						setFocusedNodeId,
					}}
				>
					<TreeViewFlatContext.Provider value={flatContextValue}>
						<DndProvider backend={HTML5Backend}>
							<NodeContextMenu
								disabled={!allowRootContextMenu}
								node={{
									id: 'root',
									name: 'root',
									type: 'root',
									filePath: 'root',
									parent: null,
								}}
								target={container}
							>
								<Box
									ref={container}
									role='tree'
									aria-label='Project tree'
									h='100%'
									_focus={{ outline: 'none' }}
								>
									<RootDropContainer>
										<Box
											ref={scrollRef}
											h='100%'
											overflowY='auto'
											overflowX='hidden'
											css={{
												'&::-webkit-scrollbar': { width: '6px' },
												'&::-webkit-scrollbar-track': { background: 'transparent' },
												'&::-webkit-scrollbar-thumb': {
													background: 'color-mix(in srgb, var(--beak-colors-fg-muted) 22%, transparent)',
													borderRadius: '3px',
												},
												'&::-webkit-scrollbar-thumb:hover': {
													background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
												},
											}}
										>
											<LayoutGroup>
												<Box
													position='relative'
													width='100%'
													style={{ height: virtualizer.getTotalSize() }}
												>
													{virtualItems.map(v => {
														const item = flat[v.index];
														if (!item) return null;
														return (
															<Box
																key={item.id}
																position='absolute'
																top={0}
																left={0}
																width='100%'
																style={{ transform: `translateY(${v.start}px)` }}
																data-index={v.index}
															>
																{item.isFolder ? (
																	<FolderNode
																		depth={item.depth}
																		node={item.node as TreeViewFolderNode}
																	/>
																) : (
																	<Node
																		depth={item.depth}
																		node={item.node as TreeViewNode}
																	/>
																)}
															</Box>
														);
													})}
												</Box>
											</LayoutGroup>
										</Box>
									</RootDropContainer>
								</Box>
							</NodeContextMenu>
						</DndProvider>
					</TreeViewFlatContext.Provider>
				</TreeViewFocusContext.Provider>
			</TreeViewAbstractionsContext.Provider>
		</TreeViewNodesContext.Provider>
	);
};

export default TreeView;
