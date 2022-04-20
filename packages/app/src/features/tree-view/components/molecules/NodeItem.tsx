import React from 'react';
import { useDispatch } from 'react-redux';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { projectPanePreferenceSetCollapse } from '@beak/app/store/preferences/actions';
import styled from 'styled-components';

interface NodeItemProps {
	id: string;
	depth: number;
	collapsible?: boolean;
	collapsed?: boolean;
}

const NodeItem: React.FunctionComponent<NodeItemProps> = props => {
	const { depth, collapsible, collapsed, children } = props;
	const dispatch = useDispatch();

	return (
		<NodeItemContainer
			$depth={depth}
			tabIndex={0}
			onClick={() => {
				if (collapsible) {
					dispatch(projectPanePreferenceSetCollapse({
						key: props.id,
						collapsed: !collapsed,
					}));
				}
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
