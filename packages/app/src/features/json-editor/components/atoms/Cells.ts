import styled from 'styled-components';

export const HeaderCell = styled.div`
	padding: 2px 0;
`;

export const HeaderKeyCell = styled(HeaderCell)`
	flex: 3;
	padding-left: 5px;
`;
export const HeaderTypeCell = styled(HeaderCell)`
	width: 40px;
`;
export const HeaderValueCell = styled(HeaderCell)`
	flex: 7;
	padding-left: 5px;
`;
export const HeaderAction = styled(HeaderCell)`
	width: 30px;
`;

export const BodyCell = styled.div`
	> article, > input {
		width: calc(100% - 10px);
		height: calc(100% - 5px);
		border: none;
		background: none;
		padding: 2px 5px;
		margin: 0;
		border: 1px solid transparent;
		font-size: 12px;

		&:focus {
			box-shadow: none !important;
		}
	}

	> input:disabled {
		color: inherit;
		user-select: none;
	}
`;

export const BodyPrimaryCell = styled(BodyCell)<{ depth: number }>`
	flex: 3;

	padding-left: ${p => p.depth * 5}px;
`;
export const BodyTypeCell = styled(BodyCell)`
	width: 40px;
`;
export const BodyInputValueCell = styled(BodyCell)`
	flex: 7;
`;
export const BodyLabelValueCell = styled(BodyInputValueCell)`
	padding-left: 5px;
`;
export const BodyAction = styled(BodyCell)`
	width: 30px;
`;
