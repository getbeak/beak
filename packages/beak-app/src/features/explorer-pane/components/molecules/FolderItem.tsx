import React, { useState } from 'react';
import styled from 'styled-components';

import { FolderNode } from '../../../../lib/project/types';
import RequestItem from './RequestItem';

export interface FolderItemProps {
	depth: number;
	node: FolderNode;
}

// This rule seems to be broken? fails on `depth + 1`
/* eslint-disable @typescript-eslint/restrict-plus-operands */

const FolderItem: React.FunctionComponent<FolderItemProps> = props => {
	const { depth, node } = props;
	const [show, setShow] = useState(true);

	return (
		<React.Fragment>
			<Wrapper depth={depth} onClick={() => setShow(!show)}>
				<Chevron expanded={show} />
				{node.name}
			</Wrapper>

			{show && node.children.map(n => {
				if (n.type === 'folder')
					return <FolderItem depth={depth + 1} key={n.filePath} node={n} />;

				return <RequestItem depth={depth + 1} key={n.filePath} node={n} />;
			})}
		</React.Fragment>
	);
};

const Wrapper = styled.div<{ depth: number }>`
	padding: 2px 0;
	padding-left: ${props => (props.depth * 8) + 21}px;
	cursor: pointer;
	font-size: 12px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};

	&:hover {
		background-color: ${props => props.theme.ui.background};
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
