import { useContext } from 'react';
import { ConnectDragPreview, ConnectDragSource, ConnectDropTarget, useDrag, useDrop } from 'react-dnd';
import { useDispatch } from 'react-redux';

import { TreeViewAbstractionsContext } from '../contexts/abstractions-context';
import { TreeViewItem } from '../types';

interface DragCollection {
	dragging: boolean;
}

export function useNodeDrag(node: TreeViewItem): [DragCollection, ConnectDragSource, ConnectDragPreview] {
	const context = useContext(TreeViewAbstractionsContext);
	const [options, dragRef, dragPreviewRef] = useDrag(() => ({
		item: node,
		canDrag: Boolean(context.onDrop),
		type: node.type,
		collect: monitor => ({
			dragging: monitor.isDragging(),
		}),
	}), [node.id, node.filePath]);

	return [options, dragRef, dragPreviewRef];
}

interface DropCollection {
	hovering: boolean;
	canDrop: boolean;
}

export function useNodeDrop(node: TreeViewItem): [DropCollection, ConnectDropTarget] {
	const dispatch = useDispatch();
	const context = useContext(TreeViewAbstractionsContext);
	const [options, dropRef] = useDrop<TreeViewItem, unknown, DropCollection>(() => ({
		accept: ['request', 'folder'],
		canDrop: (item, monitor) => {
			if (!monitor.isOver({ shallow: true }))
				return false;

			// Ensure not the same node
			const sameId = item.id === node.id;

			// Ensure not the same directory already
			const sameDir = item.parent === node.filePath;

			// Ensure not a subdirectory of oneself
			const insideSubDir = node.filePath.startsWith(item.filePath);

			return !sameId && !sameDir && !insideSubDir;
		},
		drop: (item, monitor) => {
			if (!monitor.isOver({ shallow: true }))
				return void 0;

			const action = context.onDrop?.(item.id, node.id);

			if (action)
				dispatch(action);

			return void 0;
		},
		collect: monitor => ({
			hovering: monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	}), [node.id, node.filePath]);

	return [options, dropRef];
}
