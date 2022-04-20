import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { projectPanePreferenceSetCollapse } from '@beak/app/store/preferences/actions';
import styled from 'styled-components';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { useNodeDrag } from '../../hooks/drag-and-drop';
import { TreeViewItem } from '../../types';

interface NodeItemProps {
	node: TreeViewItem;
	depth: number;
	collapsible?: boolean;
	collapsed?: boolean;
}

const NodeItem: React.FunctionComponent<NodeItemProps> = props => {
	const { node, depth, collapsible, collapsed, children } = props;
	const dispatch = useDispatch();
	const context = useContext(TreeViewAbstractionsContext);

	const [, dragRef] = useNodeDrag(node);

	return (
		<NodeItemContainer
			$depth={depth}
			tabIndex={0}
			ref={dragRef}
			onClick={event => {
				if (event.detail > 1) {
					context.onNodeDoubleClick?.(event, node);

					return;
				}

				context.onNodeClick?.(event, node);

				if (!collapsible)
					return;

				dispatch(projectPanePreferenceSetCollapse({
					key: node.id,
					collapsed: !collapsed,
				}));
			}}
		>
			{children}
		</NodeItemContainer>
	);
};

const NodeItemContainer = styled.div<{ $depth: number }>`
	display: flex;
	padding: 3px 0;
	padding-left: ${p => (p.$depth * 8) + 7}px;
	color: ${p => p.theme.ui.textMinor};
	align-items: center;
	cursor: pointer;
	font-size: 13px;
	line-height: 18px;
	border-top-left-radius: 4px;
	border-bottom-left-radius: 4px;

	&:hover {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
	&:focus {
		outline: none;
		background-color: ${p => toVibrancyAlpha(p.theme.ui.secondarySurface, 0.8)};
	}
`;

export default NodeItem;
