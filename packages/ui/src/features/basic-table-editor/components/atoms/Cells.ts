import styled from 'styled-components';

export const HeaderCell = styled.div`
	padding: 2px 0;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
export const HeaderKeyCell = styled(HeaderCell)`
	padding-left: 5px;
`;
export const HeaderValueCell = styled(HeaderCell)`
	padding-left: 5px;
`;
export const HeaderAction = styled(HeaderCell)``;

export const BodyCell = styled.div``;
export const BodyPrimaryCell = styled(BodyCell)`
	display: flex;
	flex-direction: row;
`;
export const BodyInputWrapper = styled(BodyCell)`
	flex-grow: 1;

	> div > article, > input[type=text] {
		width: calc(100% - 10px);
		height: calc(100% - 5px);
		border: none;
		background: none;
		padding: 2px 5px;
		margin: 0;
		border: 1px solid transparent;
		font-size: 12px;

		color: ${props => props.theme.ui.textMinor};
	}

	> input:disabled {
		color: inherit;
		user-select: none;
	}
`;
export const BodyInputValueCell = styled(BodyCell)``;
export const BodyAction = styled(BodyCell)`
`;
