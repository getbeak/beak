import React from 'react';
import { ReflexSplitter as RS, type ReflexSplitterProps as RSP } from 'react-reflex';
import styled, { css } from 'styled-components';

// react-reflex applies inline styles on its own root element, so every rule
// here needs `!important` to win specificity. The colours read from the
// new Chakra CSS variables so the splitter follows the active theme.

export interface ReflexSplitterProps extends RSP {
	orientation: 'horizontal' | 'vertical';
	hideVisualIndicator?: boolean;
	$disabled?: boolean;
	$customChildren?: boolean;
}

const ReflexSplitter: React.FC<ReflexSplitterProps> = styled(RS)<ReflexSplitterProps>`
	width: ${props => (props.orientation === 'vertical' ? '2px' : 'auto')} !important;
	height: ${props => (props.orientation === 'horizontal' ? '2px' : 'auto')} !important;
	background-color: var(--beak-colors-border-default) !important;
	border: none !important;
	transition: background .2s, box-shadow .2s !important;

	&:hover {
		background-color: var(--beak-colors-accent-pink) !important;
		box-shadow: 0px 0px 0px 1px var(--beak-colors-accent-pink) !important;
	}

	${p => p.$customChildren && 'height: auto !important;'}

	${p =>
		p.$disabled &&
		css`
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

export const HorizontalContextualReflexSplitter: React.FC<HorizontalContextualReflexSplitterProps> = styled(
	RS,
)<HorizontalContextualReflexSplitterProps>`
	width: auto !important;
	height: auto !important;
	background-color: var(--beak-colors-border-default) !important;
	border: none !important;
`;

export default ReflexSplitter;
