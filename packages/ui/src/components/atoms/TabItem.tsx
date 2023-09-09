import React from 'react';
import styled, { css } from 'styled-components';

import TabItemSubItemsDropdown from './TabItemSubItemsDropdown';

export interface TabSubItem<T = string> {
	key: T;
	label: string;
}

export interface TabItemProps<T = string> extends Omit<React.HTMLProps<HTMLDivElement>, 'size'> {
	active?: boolean;
	activeSubItem?: string;
	lazyForwardedRef?: React.LegacyRef<HTMLDivElement>;
	size?: 'sm' | 'md';
	subItems?: TabSubItem<T>[];
	onSubItemChanged?: (subItem: T) => void;
}

const TabItem = <T = string>(props: React.PropsWithChildren<TabItemProps<T>>): React.ReactElement => {
	const {
		active,
		activeSubItem,
		children,
		lazyForwardedRef,
		onSubItemChanged,
		size,
		subItems,
		...rest
	} = props;

	return (
		<Wrapper $active={active} $size={size} ref={lazyForwardedRef} {...rest}>
			{children}
			{subItems && subItems.length > 0 && (
				<TabItemSubItemsDropdown<T>
					activeSubItem={activeSubItem!}
					subItems={subItems}
					onSubItemChanged={onSubItemChanged!}
				/>
			)}
		</Wrapper>
	);
};

export interface WrapperProps {
	$active?: boolean;
	$size?: 'sm' | 'md';
}

const Wrapper = styled.div<WrapperProps>`
	display: flex;
	border-bottom: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};

	font-size: 13px;
	color: ${props => props.theme.ui.textMinor};
	padding: 8px 12px;
	cursor: pointer;
	white-space: nowrap;

	${p => {
		if (p.$size !== 'sm')
			return '';

		return css`
			padding: 6px 8px;
			font-size: 12px;
		`;
	}}

	${({ $active, theme }) => {
		if (!$active) {
			return css`
				&:hover {
					color: ${theme.ui.textOnSurfaceBackground};
					border-bottom-color: ${theme.ui.textOnSurfaceBackground};
				}
			`;
		}

		return css`
			color: ${theme.ui.textHighlight};
			border-bottom-color: ${theme.ui.primaryFill};
		`;
	}}

	> svg {
		margin-left: 5px;
	}
`;

export default TabItem;
