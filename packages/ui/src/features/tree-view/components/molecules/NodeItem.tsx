import { Box } from '@chakra-ui/react';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { projectPanePreferenceSetCollapse } from '@beak/ui/store/preferences/actions';
import * as React from 'react';
import { useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewFlatContext } from '../../contexts/flat-context';
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

const INDENT_PX = 10;

const NodeItem: React.FC<React.PropsWithChildren<NodeItemProps>> = props => {
	const { node, depth, collapsible, collapsed, children } = props;
	const dispatch = useDispatch();
	const absContext = useContext(TreeViewAbstractionsContext);
	const focusContext = useContext(TreeViewFocusContext);
	const flatContext = useContext(TreeViewFlatContext);
	const [, renaming] = useActiveRename(node);
	const renderer = absContext.nodeFlairRenderers?.[node.type];
	const element = useRef<HTMLDivElement | null>(null);
	const [, dragRef] = useNodeDrag(node);
	const isActive = focusContext.activeNodeId === node.id;

	dragRef(element);

	useEffect(() => {
		if (focusContext.focusedNodeId === node.id) element.current?.focus();
	}, [focusContext.focusedNodeInvalidator]);

	function moveTo(targetId: string | undefined) {
		if (!targetId) return;
		const idx = flatContext.indexById[targetId];
		if (idx === undefined) return;
		flatContext.scrollToIndex(idx);
		focusContext.setFocusedNodeId(targetId);
	}

	function handleOnKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		absContext.onNodeKeyDown?.(event, node);

		if (renaming) return;

		switch (true) {
			case checkShortcut('tree-view.node.rename', event):
				absContext.onRenameStarted?.(node);
				break;

			case checkShortcut('tree-view.node.left', event): {
				if (collapsible && !collapsed) {
					dispatch(
						projectPanePreferenceSetCollapse({
							key: node.id,
							collapsed: true,
						}),
					);
					return;
				}
				const currentIdx = flatContext.indexById[node.id];
				const prev = flatContext.flat[currentIdx - 1];
				moveTo(prev?.id);
				break;
			}

			case checkShortcut('tree-view.node.right', event): {
				if (collapsible && collapsed) {
					dispatch(
						projectPanePreferenceSetCollapse({
							key: node.id,
							collapsed: false,
						}),
					);
					return;
				}
				const currentIdx = flatContext.indexById[node.id];
				const next = flatContext.flat[currentIdx + 1];
				moveTo(next?.id);
				break;
			}

			case checkShortcut('tree-view.node.up', event): {
				const currentIdx = flatContext.indexById[node.id];
				const prev = flatContext.flat[currentIdx - 1];
				moveTo(prev?.id);
				break;
			}

			case checkShortcut('tree-view.node.down', event): {
				const currentIdx = flatContext.indexById[node.id];
				const next = flatContext.flat[currentIdx + 1];
				moveTo(next?.id);
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
				position='relative'
				display='flex'
				py='1'
				pr='1.5'
				style={{ paddingLeft: `${depth * INDENT_PX + 6}px` }}
				alignItems='center'
				justifyContent='space-between'
				cursor='pointer'
				fontSize='sm'
				lineHeight='15px'
				borderTopLeftRadius='sm'
				borderBottomLeftRadius='sm'
				color={isActive ? 'fg.default' : 'fg.muted'}
				transition='color .12s ease, background-color .12s ease'
				_hover={{
					color: 'fg.default',
					bg: isActive
						? undefined
						: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 30%, transparent)',
				}}
				_focus={{
					outline: 'none',
					bg: isActive
						? undefined
						: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 50%, transparent)',
				}}
				onKeyDown={handleOnKeyDown}
				onClick={handleOnClick}
			>
				{isActive && (
					<Box
						position='absolute'
						inset='0'
						borderRadius='sm'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
						pointerEvents='none'
					/>
				)}
				{isActive && (
					<Box
						position='absolute'
						top='0'
						bottom='0'
						left='0'
						w='2px'
						bg='accent.pink'
						borderTopRightRadius='2px'
						borderBottomRightRadius='2px'
						pointerEvents='none'
					/>
				)}
				{depth > 0 && (
					<Box
						position='absolute'
						top={0}
						bottom={0}
						left={0}
						pointerEvents='none'
						aria-hidden
					>
						{Array.from({ length: depth }).map((_, i) => (
							<Box
								// biome-ignore lint/suspicious/noArrayIndexKey: depth-stable
								key={i}
								position='absolute'
								top={0}
								bottom={0}
								width='1px'
								style={{ left: `${i * INDENT_PX + 9}px` }}
								bg='color-mix(in srgb, var(--beak-colors-border-subtle) 70%, transparent)'
							/>
						))}
					</Box>
				)}
				<Box position='relative' display='flex' alignItems='center' minW={0}>
					{children}
				</Box>
				<Box ml='auto' pl='2' position='relative'>{renderer?.(node)}</Box>
			</Box>
		</NodeContextMenu>
	);
};

export default NodeItem;
