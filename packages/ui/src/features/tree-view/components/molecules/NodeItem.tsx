import { Box } from '@chakra-ui/react';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { projectPanePreferenceSetCollapse } from '@beak/ui/store/preferences/actions';
import { selectNextLogicalNode, selectPreviousLogicalNode } from '@beak/ui/utils/keyboard-dom-node-navigation';
import * as React from 'react';
import { useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewFocusContext } from '../../contexts/focus-context';
import { useNodeDrag } from '../../hooks/drag-and-drop';
import { useActiveRename } from '../../hooks/use-active-rename';
import type { TreeViewItem } from '../../types';
import NodeContextMenu from './NodeContextMenu';

interface NodeItemProps {
	node: TreeViewItem;
	depth: number;
	collapsible?: boolean;
	collapsed?: boolean;
}

const NodeItem: React.FC<React.PropsWithChildren<NodeItemProps>> = props => {
	const { node, depth, collapsible, collapsed, children } = props;
	const dispatch = useDispatch();
	const absContext = useContext(TreeViewAbstractionsContext);
	const focusContext = useContext(TreeViewFocusContext);
	const [, renaming] = useActiveRename(node);
	const renderer = absContext.nodeFlairRenderers?.[node.type];
	const element = useRef<HTMLDivElement | null>(null);
	const [, dragRef] = useNodeDrag(node);

	dragRef(element);

	useEffect(() => {
		if (focusContext.focusedNodeId === node.id) element.current?.focus();
	}, [focusContext.focusedNodeInvalidator]);

	function handleOnKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		absContext.onNodeKeyDown?.(event, node);

		if (renaming) return;

		switch (true) {
			case checkShortcut('tree-view.node.rename', event):
				absContext.onRenameStarted?.(node);
				break;

			case checkShortcut('tree-view.node.left', event): {
				if (node.type === 'folder' && !collapsed) {
					dispatch(
						projectPanePreferenceSetCollapse({
							key: node.id,
							collapsed: !collapsed,
						}),
					);

					return;
				}

				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root) return;

				selectPreviousLogicalNode(root, selected);
				break;
			}

			case checkShortcut('tree-view.node.right', event): {
				if (node.type === 'folder' && collapsed) {
					dispatch(
						projectPanePreferenceSetCollapse({
							key: node.id,
							collapsed: !collapsed,
						}),
					);

					return;
				}

				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root) return;

				selectNextLogicalNode(root, selected);
				break;
			}

			case checkShortcut('tree-view.node.up', event): {
				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root) return;

				selectPreviousLogicalNode(root, selected);
				break;
			}

			case checkShortcut('tree-view.node.down', event): {
				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root) return;

				selectNextLogicalNode(root, selected);
				break;
			}

			default:
				return;
		}

		event.preventDefault();
	}

	function handleOnClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
		if (event.detail === 2) {
			absContext.onNodeDoubleClick?.(event, node);

			return;
		}

		absContext.onNodeClick?.(event, node);

		if (!collapsible) return;

		dispatch(
			projectPanePreferenceSetCollapse({
				key: node.id,
				collapsed: !collapsed,
			}),
		);
	}

	return (
		<NodeContextMenu node={node} target={element}>
			<Box
				ref={element}
				tabIndex={0}
				display='flex'
				py='1'
				pr='1.5'
				style={{ paddingLeft: `${depth * 8 + 6}px` }}
				alignItems='center'
				justifyContent='space-between'
				cursor='pointer'
				fontSize='sm'
				lineHeight='15px'
				borderTopLeftRadius='sm'
				borderBottomLeftRadius='sm'
				color={focusContext.activeNodeId === node.id ? 'fg.default' : 'fg.muted'}
				bg={
					focusContext.activeNodeId === node.id
						? 'color-mix(in srgb, var(--beak-colors-bg-surface) 80%, transparent)'
						: 'transparent'
				}
				_hover={{ color: 'fg.default' }}
				_focus={{
					outline: 'none',
					bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 100%, transparent)',
				}}
				onKeyDown={handleOnKeyDown}
				onClick={handleOnClick}
			>
				{children}
				<Box ml='auto' pl='2'>{renderer?.(node)}</Box>
			</Box>
		</NodeContextMenu>
	);
};

export default NodeItem;
