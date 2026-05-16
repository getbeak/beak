import type { ApplicationState } from '@beak/ui/store';
import { Box, TreeView as ChakraTreeView } from '@chakra-ui/react';
import type { PayloadAction } from '@reduxjs/toolkit';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MenuItemConstructorOptions } from 'electron';
import React, { type ReactElement, useEffect, useMemo, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import useSectionBody from '../../sidebar/hooks/use-section-body';
import { type TreeCommands, TreeViewAbstractionsContext } from '../contexts/abstractions-context';
import { TreeViewMachineContext } from '../contexts/machine-context';
import useTreeCollection from '../hooks/use-tree-collection';
import useTreeViewMachine from '../hooks/use-tree-view-machine';
import type { TreeViewItem, TreeViewNodes } from '../types';
import NodeContextMenu from './molecules/NodeContextMenu';
import RootDropContainer from './molecules/RootDropContainer';
import TreeRow from './molecules/TreeRow';

interface TreeViewProps {
	tree: TreeViewNodes;
	rootParentName: string;
	activeNodeId?: string;
	allowRootContextMenu?: boolean;
	/**
	 * Reveal folders whose path includes a `_`-prefixed segment (e.g.
	 * `tree/_schemas/…`). Off by default — these are managed metadata
	 * subtrees the user usually shouldn't hand-edit.
	 */
	showHidden?: boolean;

	nodeFlairRenderers?: {
		[k: string]: (node: TreeViewItem) => ReactElement;
	};

	renameSelector?: (node: TreeViewItem, state: ApplicationState) => unknown;
	onRenameStarted?: (node: TreeViewItem) => void;
	onRenameUpdated?: (node: TreeViewItem, name: string) => void;
	onRenameSubmitted?: (node: TreeViewItem) => void;
	onRenameEnded?: (node: TreeViewItem) => void;

	/** Lets a parent component reach into the TreeView's expand/collapse API
	 *  for things like a sidebar action button row. The ref is populated on
	 *  mount and cleared on unmount. */
	commandsRef?: React.MutableRefObject<TreeCommands | null>;
	onContextMenu?: (node: TreeViewItem) => MenuItemConstructorOptions[];
	onDrop?: (sourceNodeId: string, destinationNodeId: string) => PayloadAction<unknown>;
	onNodeClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>, node: TreeViewItem) => void;
}

const ROW_HEIGHT = 22;
const OVERSCAN = 12;

const embedded = Boolean(typeof window !== 'undefined' && window.embeddedIndicator);

const TreeView: React.FC<React.PropsWithChildren<TreeViewProps>> = props => {
	const { tree, rootParentName, activeNodeId, allowRootContextMenu, showHidden } = props;
	const container = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	const collection = useTreeCollection(tree, rootParentName, showHidden);
	const treeApi = useTreeViewMachine({ collection, activeNodeId });

	const visibleNodes = useMemo(() => treeApi.getVisibleNodes(), [treeApi]);

	const commands = useMemo<TreeCommands>(
		() => ({
			expandAll: () => treeApi.expand(),
			collapseAll: () => treeApi.collapse(),
			expandDescendantsOf: nodeId => {
				const node = collection.findNode(nodeId);
				if (!node) return;
				// Walk the subtree under this folder; passing the folder node
				// itself gives every branch beneath it. Add the folder id too so
				// the menu's "Expand all" from a collapsed folder opens it first.
				const branches = collection.getBranchValues(node);
				treeApi.setExpandedValue(Array.from(new Set([...treeApi.expandedValue, nodeId, ...branches])));
			},
			collapseDescendantsOf: nodeId => {
				const node = collection.findNode(nodeId);
				if (!node) return;
				const branches = new Set([nodeId, ...collection.getBranchValues(node)]);
				treeApi.setExpandedValue(treeApi.expandedValue.filter(id => !branches.has(id)));
			},
		}),
		[treeApi, collection],
	);

	const { commandsRef } = props;
	useEffect(() => {
		if (!commandsRef) return;
		commandsRef.current = commands;
		return () => {
			commandsRef.current = null;
		};
	}, [commands, commandsRef]);

	const virtualizer = useVirtualizer({
		count: visibleNodes.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: OVERSCAN,
		getItemKey: index => visibleNodes[index]?.node.id ?? index,
	});

	const abstractionsValue = useMemo(
		() => ({
			activeNodeId,
			commands,
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
		}),
		[
			activeNodeId,
			commands,
			props.nodeFlairRenderers,
			props.renameSelector,
			props.onRenameStarted,
			props.onRenameUpdated,
			props.onRenameSubmitted,
			props.onRenameEnded,
			props.onContextMenu,
			props.onDrop,
			props.onNodeClick,
			props.onNodeDoubleClick,
			props.onNodeKeyDown,
		],
	);

	useSectionBody({ flexGrow: 2 });

	const virtualItems = virtualizer.getVirtualItems();

	return (
		<TreeViewAbstractionsContext.Provider value={abstractionsValue}>
			<TreeViewMachineContext.Provider value={treeApi}>
				<DndProvider backend={HTML5Backend}>
					<NodeContextMenu
						disabled={!allowRootContextMenu}
						node={{ id: 'root', name: 'root', type: 'root', filePath: 'root', parent: null }}
						target={container}
					>
						{/*
						 * `getRootProps` is on the outer container (carries aria id/dir);
						 * `getTreeProps` is on the scrollable area (carries role=tree +
						 * keyboard handlers — arrows, typeahead, F2, *, cmd-A, Home/End).
						 */}
						<ChakraTreeView.RootProvider value={treeApi} h='100%'>
							<Box ref={container} h='100%' _focus={{ outline: 'none' }}>
								<RootDropContainer>
									<Box
										ref={scrollRef}
										{...treeApi.getTreeProps()}
										h='100%'
										overflowY='auto'
										overflowX='hidden'
										style={embedded ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties) : undefined}
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
											...(embedded && {
												// The scroll container itself is a drag region — empty
												// space below the last row picks up the window-drag.
												// Real tree items + branch toggles opt out so clicks
												// + drag-and-drop still work.
												'[role=treeitem], [role=button]': { WebkitAppRegion: 'no-drag' as never },
											}),
										}}
									>
										<Box position='relative' width='100%' style={{ height: virtualizer.getTotalSize() }}>
											{virtualItems.map(v => {
												const visible = visibleNodes[v.index];
												if (!visible) return null;
												const nodeState = treeApi.getNodeState({
													node: visible.node,
													indexPath: visible.indexPath,
												});
												return (
													<Box
														key={visible.node.id}
														position='absolute'
														top={0}
														left={0}
														width='100%'
														style={{ transform: `translateY(${v.start}px)` }}
														data-index={v.index}
													>
														<TreeRow node={visible.node} indexPath={visible.indexPath} nodeState={nodeState} />
													</Box>
												);
											})}
										</Box>
									</Box>
								</RootDropContainer>
							</Box>
						</ChakraTreeView.RootProvider>
					</NodeContextMenu>
				</DndProvider>
			</TreeViewMachineContext.Provider>
		</TreeViewAbstractionsContext.Provider>
	);
};

export default TreeView;
