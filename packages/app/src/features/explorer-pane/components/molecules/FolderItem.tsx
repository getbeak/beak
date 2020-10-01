import { FolderNode } from '@beak/common/src/beak-project/types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Switch from './Switch';

export interface FolderItemProps {
	depth: number;
	id: string;
}

// This rule seems to be broken? fails on `depth + 1`
/* eslint-disable @typescript-eslint/restrict-plus-operands */

const FolderItem: React.FunctionComponent<FolderItemProps> = props => {
	const { depth } = props;
	const [show, setShow] = useState(true);
	const node = useSelector(s => s.global.project.tree![props.id]) as FolderNode;

	return (
		<React.Fragment>
			<Wrapper depth={depth} onClick={() => setShow(!show)}>
				<Chevron expanded={show} />
				{node.name}
			</Wrapper>

			{show && node.children.map(i => <Switch depth={depth + 1} key={i} id={i} />)}
		</React.Fragment>
	);
};

const Wrapper = styled.div<{ depth: number }>`
	padding: 3px 0;
	padding-left: ${props => (props.depth * 8) + 21}px;
	color: ${props => props.theme.ui.textMinor};
	cursor: pointer;
	font-size: 13px;
	line-height: 18px;

	&:hover {
		color: ${props => props.theme.ui.textOnSurfaceBackground};
	}
`;

const Chevron = styled.div<{ expanded: boolean }>`
	display: inline-block;
	border-right: 1px solid ${props => props.theme.ui.textOnSurfaceBackground};
	border-bottom: 1px solid ${props => props.theme.ui.textOnSurfaceBackground};
	width: 5px;
	height: 5px;
	margin-right: 5px;
	margin-left: -5px;
	transform: rotate(${props => props.expanded ? '45deg' : '-45deg'});
	transform-origin: 50%;

	margin-bottom: ${props => props.expanded ? '2px' : '1px'};
`;

export default FolderItem;
