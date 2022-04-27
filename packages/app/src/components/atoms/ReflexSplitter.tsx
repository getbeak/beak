import React from 'react';
import { ReflexSplitter as RS, ReflexSplitterProps as RSP } from 'react-reflex';
import styled, { css } from 'styled-components';

// TODO(afr): Get rid of importants when css import is removed

export interface ReflexSplitterProps extends RSP {
	orientation: 'horizontal' | 'vertical';
	hideVisualIndicator?: boolean;
	$disabled?: boolean;
	$customChildren?: boolean;
}

const ReflexSplitter = styled(RS)<ReflexSplitterProps>`
	width: ${props => props.orientation === 'vertical' ? '2px' : 'auto'} !important;
	height: ${props => props.orientation === 'horizontal' ? '2px' : 'auto'} !important;
	background-color: ${props => props.theme.ui.backgroundBorderSeparator} !important;
	border: none !important;
	transition: background .6s, box-shadow .6s !important;

	&:hover {
		background-color: ${props => props.theme.ui.primaryFill} !important;
		box-shadow: 0px 0px 0px 1px ${props => props.theme.ui.primaryFill} !important;
	}

	${p => p.$customChildren && 'height: auto !important;'}

	${p => p.$disabled && css`
		display: none;
		pointer-events: none !important;
		cursor: default !important;

		&:hover {
			background-color: inherit !important;
			box-shadow: inherit !important;
		}
	`}
`;

export interface HorizontalContextualReflexSplitterProps extends RSP {
	orientation: 'horizontal';
	children: React.ReactElement;
}

export const HorizontalContextualReflexSplitter = styled(RS)<HorizontalContextualReflexSplitterProps>`
	width: auto !important;
	height: auto !important;
	background-color: ${props => props.theme.ui.backgroundBorderSeparator} !important;
	border: none !important;
`;

export default ReflexSplitter;
