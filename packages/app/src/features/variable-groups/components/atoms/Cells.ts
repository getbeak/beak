import styled from 'styled-components';

export const HeaderCell = styled.div`
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border-left: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
`;
export const HeaderNameCell = styled(HeaderCell)`
	border-left: none;

	> input {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
`;
export const HeaderGroupNameCell = styled(HeaderCell)`
	display: flex;
	flex-direction: row;
`;
export const HeaderAction = styled(HeaderCell)``;

export const BodyCell = styled.div`
	border-left: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
`;
export const BodyNameCell = styled(BodyCell)`
	display: flex;
	flex-direction: row;
	border-left: none;
`;
export const BodyValueCell = styled(BodyCell)`
	> div > article {
		width: calc(100% - 12px);
		border: none;
		background: none;
		padding: 3px 5px;
		margin: 0;
		border: 1px solid transparent;
		font-size: 12px;

		color: ${props => props.theme.ui.textMinor};
	}
`;
