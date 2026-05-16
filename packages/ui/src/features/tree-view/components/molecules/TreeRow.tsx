import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { Box } from '@chakra-ui/react';
import type { NodeState } from '@zag-js/tree-view';
import * as React from 'react';
import { useContext, useRef } from 'react';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewMachineContext } from '../../contexts/machine-context';
import { useNodeDrag, useNodeDrop } from '../../hooks/drag-and-drop';
import { useActiveRename } from '../../hooks/use-active-rename';
import type { BeakTreeNode } from '../../hooks/use-tree-collection';
import type { TreeViewFolderNode, TreeViewItem } from '../../types';
import NodeContextMenu from './NodeContextMenu';
import NodeName from './NodeName';

interface TreeRowProps {
	node: BeakTreeNode;
	indexPath: number[];
	nodeState: NodeState;
}

const INDENT_PX = 10;
const GUTTER_PX = 6;

/**
 * Renders one row of the flat virtualized tree. Branch rows spread
 * Chakra's `getBranchControlProps` (gives them `data-part="branch-control"`
 * so the tree machine's key handler can find them); leaf rows spread
 * `getItemProps`. Click + keydown wrappers chain our consumer callbacks
 * (open tab, rename, duplicate) on top of the machine's own.
 */
const TreeRow: React.FC<TreeRowProps> = ({ node, indexPath, nodeState }) => {
	const treeApi = useContext(TreeViewMachineContext);
	const abs = useContext(TreeViewAbstractionsContext);
	const element = useRef<HTMLDivElement | null>(null);
	const item = node as TreeViewItem;
	const [, renaming] = useActiveRename(item);
	const renderer = abs.nodeFlairRenderers?.[item.type];

	const [{ hovering, canDrop }, dropRef] = useNodeDrop(item);
	const [, dragRef] = useNodeDrag(item);

	// Compose drag + drop on the row element. We only attach a drop target for
	// folders — leaves can't host children.
	const composedRef = (el: HTMLDivElement | null) => {
		element.current = el;
		dragRef(el);
		if (nodeState.isBranch) dropRef(el);
	};

	if (!treeApi) return null;

	const chakraProps = nodeState.isBranch
		? treeApi.getBranchControlProps({ node, indexPath })
		: treeApi.getItemProps({ node, indexPath });

	const isActive = abs.activeNodeId === item.id;
	const isSelected = nodeState.selected;
	const folderDropHighlight = nodeState.isBranch && canDrop && hovering;

	// Zag computes `depth = indexPath.length`, and because our synthetic root
	// has `indexPath = []` but is never rendered, every visible row is +1 from
	// what the eye reads as its depth. Subtract 1 here so the first user-visible
	// row sits at "depth 0" visually.
	const visualDepth = Math.max(0, nodeState.depth - 1);

	function handleClick(event: React.MouseEvent<HTMLDivElement>) {
		if (renaming) return;

		// Branches: machine click toggles expansion and selects. Consumers can
		// also act on the click (e.g., open a folder-overview tab) — we hand
		// the event off via onNodeClick before letting Chakra toggle. Modifier
		// clicks stay purely about selection, same as leaves.
		if (nodeState.isBranch) {
			const isMulti = event.metaKey || event.ctrlKey || event.shiftKey;
			if (!isMulti && event.detail !== 2) abs.onNodeClick?.(event, item);
			chakraProps.onClick?.(event as unknown as never);
			return;
		}

		// Leaves: dbl-click promotes the tab to permanent (and skips the
		// open-temp behavior — that was the first click). Modifier-clicks
		// (cmd, shift) are pure selection moves, no tab open.
		if (event.detail === 2) {
			abs.onNodeDoubleClick?.(event, item);
			chakraProps.onClick?.(event as unknown as never);
			return;
		}

		const isMulti = event.metaKey || event.ctrlKey || event.shiftKey;
		if (!isMulti) abs.onNodeClick?.(event, item);
		chakraProps.onClick?.(event as unknown as never);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (renaming) return;

		// Our shortcuts run first; preventDefault keeps Chakra's tree-level
		// onKeyDown from also acting (e.g., Enter triggering an extra NODE.CLICK).
		switch (true) {
			case checkShortcut('tree-view.node.rename', event):
				abs.onRenameStarted?.(item);
				event.preventDefault();
				return;
			default:
				abs.onNodeKeyDown?.(event, item);
		}
	}

	return (
		<NodeContextMenu node={item} target={element}>
			<Box
				ref={composedRef as React.Ref<HTMLDivElement>}
				{...chakraProps}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				position='relative'
				display='flex'
				h='22px'
				pr='3'
				style={{ paddingLeft: `${visualDepth * INDENT_PX + GUTTER_PX}px` }}
				alignItems='center'
				justifyContent='space-between'
				cursor='pointer'
				fontSize='sm'
				lineHeight='1'
				color={isActive ? 'fg.default' : 'fg.muted'}
				bg={
					folderDropHighlight
						? 'color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
						: isActive
							? 'color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)'
							: isSelected
								? 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
								: undefined
				}
				boxShadow={
					folderDropHighlight
						? 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)'
						: undefined
				}
				transition='color .1s linear, background-color .1s linear, box-shadow .1s linear'
				_hover={{
					color: 'fg.default',
					bg: isActive
						? 'color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
						: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
				}}
			>
				{isActive && <Box position='absolute' top='0' bottom='0' left='0' w='2px' bg='accent.pink' pointerEvents='none' />}
				{visualDepth > 0 && (
					<Box position='absolute' top={0} bottom={0} left={0} pointerEvents='none' aria-hidden>
						{Array.from({ length: visualDepth }).map((_, i) => (
							<Box
								// biome-ignore lint/suspicious/noArrayIndexKey: depth-stable
								key={i}
								position='absolute'
								top={0}
								bottom={0}
								width='1px'
								style={{ left: `${i * INDENT_PX + GUTTER_PX + 3}px` }}
								bg='color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)'
							/>
						))}
					</Box>
				)}
				<Box position='relative' display='flex' alignItems='center' minW={0}>
					<NodeName
						node={item}
						collapsed={nodeState.isBranch ? !nodeState.expanded : false}
						collapsible={nodeState.isBranch}
					/>
				</Box>
				<Box ml='auto' pl='2' position='relative'>
					{renderer?.(item as TreeViewFolderNode)}
				</Box>
			</Box>
		</NodeContextMenu>
	);
};

export default TreeRow;
