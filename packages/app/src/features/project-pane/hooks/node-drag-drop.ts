import { ConnectDragPreview, ConnectDragSource, ConnectDropTarget, useDrag, useDrop } from 'react-dnd';
import { useDispatch } from 'react-redux';
import { getNodeDirectory } from '@beak/app/lib/beak-project/nodes';
import { actions } from '@beak/app/store/project';
import { Nodes } from '@beak/common/types/beak-project';

interface DragCollection {
	dragging: boolean;
}

interface DropCollection {
	hovering: boolean;
	canDrop: boolean;
}

export function useNodeDrag(node: Nodes): [DragCollection, ConnectDragSource, ConnectDragPreview] {
	const [options, dragRef, dragPreviewRef] = useDrag(() => ({
		item: node,
		canDrag: true,
		type: node.type,
		collect: monitor => ({
			dragging: monitor.isDragging(),
		}),
	}), [node.id, node.filePath]);

	return [options, dragRef, dragPreviewRef];
}

export function useNodeDrop(node: Nodes): [DropCollection, ConnectDropTarget] {
	const dispatch = useDispatch();
	const [options, dropRef] = useDrop<Nodes, unknown, DropCollection>(() => ({
		accept: ['request', 'folder'],
		canDrop: item => {
			const sameId = node.id === item.id;
			const sameDirectory = getNodeDirectory(node) === getNodeDirectory(item);

			console.log(sameId, sameDirectory);

			return !sameId && !sameDirectory;
		},
		drop: item => {
			dispatch(actions.moveNodeOnDisk({
				sourceNodeId: item.id,
				destinationNodeId: node.id,
			}));

			return void 0;
		},
		collect: monitor => ({
			hovering: monitor.isOver({ shallow: false }),
			canDrop: monitor.canDrop(),
		}),
	}), [node.id, node.filePath]);

	return [options, dropRef];
}
