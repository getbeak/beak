import styled, { css } from 'styled-components';

export interface TabItemProps {
	active?: boolean;
}

const TabItem = styled.div<TabItemProps>`
	border-bottom: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};

	font-size: 13px;
	color: ${props => props.theme.ui.textMinor};
	padding: 8px 12px;
	cursor: pointer;
	text-overflow: ellipsis;
	word-wrap: initial;
	overflow: hidden;

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
