
import React from 'react';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';

interface ChevronProps {
	$collapsed: boolean;
	$collapsible: boolean;
}

const Chevron: React.FC<React.PropsWithChildren<ChevronProps>> = props => (
	<ChevronElement {...props}>
		<ChevronRight />
	</ChevronElement>
);

const ChevronElement = styled.div<ChevronProps>`
	display: inline-block;
	${p => !p.$collapsible && 'display: none;'}
	margin-right: 2px;
	margin-left: 5px;
	width: 10px;

	font-size: 9px;
	line-height: 9px;
	color: var(--beak-colors-fg-muted);

	> svg {
		transition: transform .2s ease;
		transform-origin: center center;
		transform: rotate(${p => (p.$collapsed ? '0deg' : '90deg')});
	}
`;

export default Chevron;
