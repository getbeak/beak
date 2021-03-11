import styled, { css } from 'styled-components';

export interface TabItemProps {
	active?: boolean;
	size?: 'sm' | 'md';
}

const TabItem = styled.div<TabItemProps>`
	display: flex;
	flex-direction: row;

	border-bottom: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};

	font-size: 13px;
	color: ${props => props.theme.ui.textMinor};
	padding: 8px 12px;
	cursor: pointer;
	text-overflow: ellipsis;
	word-wrap: initial;
	overflow: hidden;

	${p => {
		if (p.size !== 'sm')
			return '';

		return css`
			padding: 6px 8px;
			font-size: 12px;
		`;
	}}

	${({ active, theme }) => {
		if (!active) {
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
`;

export default TabItem;
