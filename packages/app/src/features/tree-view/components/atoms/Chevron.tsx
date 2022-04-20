import React from 'react';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

interface ChevronProps {
	$collapsed: boolean;
	$collapsible: boolean;
}

const Chevron: React.FunctionComponent<ChevronProps> = props => (
	<ChevronElement {...props}>
		<FontAwesomeIcon icon={faChevronRight} />
	</ChevronElement>
);

const ChevronElement = styled.div<ChevronProps>`
	display: inline-block;
	${p => !p.$collapsible && 'display: none;'}
	margin-right: 2px;
	width: 10px;

	font-size: 9px;
	line-height: 9px;
	color: ${p => p.theme.ui.textMinor};

	> svg {
		transition: transform .2s ease;
		transform-origin: center center;
		transform: rotate(${p => p.$collapsed ? '0deg' : '90deg'});
	}
`;

export default Chevron;
