import styled from 'styled-components';

export const HeaderCell = styled.div`
	padding: 2px 0;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
export const HeaderKeyCell = styled(HeaderCell)`
	padding-left: 5px;
`;
export const HeaderTypeCell = styled(HeaderCell)``;
export const HeaderValueCell = styled(HeaderCell)`
	padding-left: 5px;
`;
export const HeaderAction = styled(HeaderCell)``;

export const BodyCell = styled.div``;
export const BodyPrimaryCell = styled(BodyCell) <{ depth: number }>`
	display: flex;
	flex-direction: row;
	padding-left: ${p => p.depth * 10}px;
`;
export const BodyInputWrapper = styled(BodyCell)`
	flex-grow: 1;

	> article, > input[type=text] {
		width: calc(100% - 10px);
		height: calc(100% - 5px);
		border: none;
		background: none;
		padding: 2px 5px;
		margin: 0;
		border: 1px solid transparent;
		font-size: 12px;

		color: ${props => props.theme.ui.textMinor};

		&:focus {
			box-shadow: none !important;
		}
	}

	> input:disabled {
		color: inherit;
		user-select: none;
	}
`;
export const BodyNullWrapper = styled(BodyCell)`
	padding-left: 5px;
	line-height: 19px;
`;
export const BodyTypeCell = styled(BodyCell)``;
export const BodyInputValueCell = styled(BodyCell)``;
export const BodyLabelValueCell = styled(BodyInputValueCell)`
	padding-top: 2px;
	padding-left: 5px;
`;
export const BodyAction = styled(BodyCell)`
`;
