import React, { useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { toVibrancyAlpha } from '@beak/ui/design-system/utils';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { projectPanePreferenceSetCollapse } from '@beak/ui/store/preferences/actions';
import { selectNextLogicalNode, selectPreviousLogicalNode } from '@beak/ui/utils/keyboard-dom-node-navigation';
import styled from 'styled-components';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewFocusContext } from '../../contexts/focus-context';
import { useNodeDrag } from '../../hooks/drag-and-drop';
import { useActiveRename } from '../../hooks/use-active-rename';
import { TreeViewItem } from '../../types';
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
		if (focusContext.focusedNodeId === node.id)
			element.current?.focus();
	}, [focusContext.focusedNodeInvalidator]);

	function handleOnKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		absContext.onNodeKeyDown?.(event, node);

		if (renaming)
			return;

		switch (true) {
			case checkShortcut('tree-view.node.rename', event):
				absContext.onRenameStarted?.(node);
				break;

			case checkShortcut('tree-view.node.left', event): {
				if (node.type === 'folder' && !collapsed) {
					dispatch(projectPanePreferenceSetCollapse({
						key: node.id,
						collapsed: !collapsed,
					}));

					return;
				}

				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root)
					return;

				selectPreviousLogicalNode(root, selected);
				break;
			}

			case checkShortcut('tree-view.node.right', event): {
				if (node.type === 'folder' && collapsed) {
					dispatch(projectPanePreferenceSetCollapse({
						key: node.id,
						collapsed: !collapsed,
					}));

					return;
				}

				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root)
					return;

				selectNextLogicalNode(root, selected);
				break;
			}

			case checkShortcut('tree-view.node.up', event): {
				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root)
					return;

				selectPreviousLogicalNode(root, selected);
				break;
			}

			case checkShortcut('tree-view.node.down', event): {
				const selected = element.current;
				const root = focusContext.rootRef.current;

				if (!selected || !root)
					return;

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

		if (!collapsible)
			return;

		dispatch(projectPanePreferenceSetCollapse({
			key: node.id,
			collapsed: !collapsed,
		}));
	}

	return (
		<NodeContextMenu node={node} target={element}>
			<NodeItemContainer
				$active={focusContext.activeNodeId === node.id}
				$depth={depth}
				tabIndex={0}
				ref={element}
				onKeyDown={handleOnKeyDown}
				onClick={handleOnClick}
			>
				{children}
				<FlairRendererContainer>
					{renderer?.(node)}
				</FlairRendererContainer>
			</NodeItemContainer>
		</NodeContextMenu>
	);
};

interface NodeItemContainerProps {
	$active: boolean;
	$depth: number;
}

const NodeItemContainer = styled.div<NodeItemContainerProps>`
	display: flex;
	padding: 4px 0;
	padding-right: 5px;
	padding-left: ${p => (p.$depth * 8) + 6}px;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	font-size: 12px;
	line-height: 15px;
	border-top-left-radius: 4px;
	border-bottom-left-radius: 4px;

	color: ${p => p.$active ? p.theme.ui.textOnSurfaceBackground : p.theme.ui.textMinor};
	background-color: ${p => p.$active ? toVibrancyAlpha(p.theme.ui.surface, 0.8) : 'transparent'};

	&:hover {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
	&:focus {
		outline: none;
		background-color: ${p => toVibrancyAlpha(p.theme.ui.secondarySurface, 1)};
	}
`;

const FlairRendererContainer = styled.div`
	margin-left: auto;
	padding-left: 8px;
`;

export default NodeItem;
