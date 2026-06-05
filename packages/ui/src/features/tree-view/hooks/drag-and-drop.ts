import { useContext } from 'react';
import { type ConnectDragPreview, type ConnectDragSource, type ConnectDropTarget, useDrag, useDrop } from 'react-dnd';
import { useDispatch } from 'react-redux';

import { TreeViewAbstractionsContext } from '../contexts/abstractions-context';
import { TreeViewMachineContext } from '../contexts/machine-context';
import type { TreeViewItem } from '../types';

interface DragCollection {
	dragging: boolean;
}

/**
 * Drag payload — always carries `primary` (the row the user grabbed) plus
 * `nodes`, the full set being moved. When the grabbed row is in the current
 * selection, the whole selection rides along; otherwise it's just `[primary]`.
 */
interface DragItem {
	primary: TreeViewItem;
	nodes: TreeViewItem[];
}

function isValidDrop(source: TreeViewItem, target: TreeViewItem): boolean {
	// A node can't drop onto itself.
	if (source.id === target.id) return false;

	// A node can't drop into the folder it already lives in (including the
	// implicit root → root case).
	const sameDir = source.parent === target.filePath || (source.parent == null && target.id === 'root');
	if (sameDir) return false;

	// A folder can't drop into one of its own descendants. Empty `source.filePath`
	// (workflows, which aren't path-addressable) would otherwise match every
	// target via String.startsWith('').
	if (source.filePath !== '' && target.filePath.startsWith(source.filePath)) return false;

	return true;
}

export function useNodeDrag(node: TreeViewItem): [DragCollection, ConnectDragSource, ConnectDragPreview] {
	const context = useContext(TreeViewAbstractionsContext);
	const treeApi = useContext(TreeViewMachineContext);
	const [options, dragRef, dragPreviewRef] = useDrag<DragItem, unknown, DragCollection>(
		() => ({
			item: () => {
				const selectedIds = treeApi?.selectedValue ?? [];
				const draggingSelection = selectedIds.length > 1 && selectedIds.includes(node.id);

				if (!draggingSelection) return { primary: node, nodes: [node] };

				// Resolve the other selected ids back to TreeViewItems via the
				// machine's collection so the drop handler doesn't need its own
				// lookup path. `findNodes` returns BeakTreeNodes (TreeViewItem +
				// optional `children`), so the cast is safe shape-wise.
				const resolved = treeApi!.collection.findNodes(selectedIds) as TreeViewItem[];
				return { primary: node, nodes: resolved };
			},
			canDrag: Boolean(context.onDrop),
			type: node.type,
			collect: monitor => ({ dragging: monitor.isDragging() }),
		}),
		[node.id, node.filePath, treeApi],
	);

	return [options, dragRef, dragPreviewRef];
}

interface DropCollection {
	hovering: boolean;
	canDrop: boolean;
}

export function useNodeDrop(node: TreeViewItem): [DropCollection, ConnectDropTarget] {
	const dispatch = useDispatch();
	const context = useContext(TreeViewAbstractionsContext);
	const [options, dropRef] = useDrop<DragItem, unknown, DropCollection>(
		() => ({
			accept: ['request', 'folder', 'workflow'],
			canDrop: (item, monitor) => {
				if (!monitor.isOver({ shallow: true })) return false;
				// Permissive: a drop is allowed if at least one source is valid.
				// The drop handler skips invalid sources so the user doesn't have
				// to deselect them before dragging the rest.
				return item.nodes.some(source => isValidDrop(source, node));
			},
			drop: (item, monitor) => {
				if (!monitor.isOver({ shallow: true })) return void 0;
				if (!context.onDrop) return void 0;

				for (const source of item.nodes) {
					if (!isValidDrop(source, node)) continue;
					const action = context.onDrop(source.id, node.id);
					if (action) dispatch(action);
				}
				return void 0;
			},
			collect: monitor => ({
				hovering: monitor.isOver(),
				canDrop: monitor.canDrop(),
			}),
		}),
		[node.id, node.filePath],
	);

	return [options, dropRef];
}
