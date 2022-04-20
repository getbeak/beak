import React, { useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { projectPanePreferenceSetCollapse } from '@beak/app/store/preferences/actions';
import styled from 'styled-components';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewFocusContext } from '../../contexts/focus-context';
import { useNodeDrag } from '../../hooks/drag-and-drop';
import { TreeViewItem } from '../../types';
import NodeContextMenu from './NodeContextMenu';

interface NodeItemProps {
	node: TreeViewItem;
	depth: number;
	collapsible?: boolean;
	collapsed?: boolean;
}

const NodeItem: React.FunctionComponent<NodeItemProps> = props => {
	const { node, depth, collapsible, collapsed, children } = props;
	const dispatch = useDispatch();
	const absContext = useContext(TreeViewAbstractionsContext);
	const focusContext = useContext(TreeViewFocusContext);

	const renderer = absContext.nodeFlairRenderers?.[node.type];
	const element = useRef<HTMLDivElement | null>(null);
	const [, dragRef] = useNodeDrag(node);

	dragRef(element);

	return (
		<NodeContextMenu node={node} target={element}>
			<NodeItemContainer
				$active={focusContext.activeNodeId === node.id}
				$depth={depth}
				tabIndex={0}
				ref={element}
				onClick={event => {
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
				}}
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
	padding-left: ${p => (p.$depth * 8) + 2}px;
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
`;

export default NodeItem;
