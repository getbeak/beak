import styled from 'styled-components';

export const HeaderCell = styled.div`
	padding: 2px 0;
`;

export const HeaderFoldCell = styled(HeaderCell)`
	width: 20px;
`;
export const HeaderKeyCell = styled(HeaderCell)`
	flex: 35%;
	padding-left: 5px;
`;
export const HeaderValueCell = styled(HeaderCell)`
	flex: 65%;
	padding-left: 5px;
`;
export const HeaderTypeCell = styled(HeaderCell)`
	width: 40px;
`;
export const HeaderToggle = styled(HeaderCell)`
	width: 20px;
`;
export const HeaderAction = styled(HeaderCell)`
	width: 20px;
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

export const BodyFoldCell = styled(BodyCell)`
	width: 20px;
`;
export const BodyKeyCell = styled(BodyCell)`
	flex: 35%;
`;
export const BodyInputValueCell = styled(BodyCell)`
	flex: 65%;
`;
export const BodyLabelValueCell = styled(BodyCell)`
	flex: 65%;
	padding-left: 5px;
`;
export const BodyTypeCell = styled(BodyCell)`
	width: 40px;
`;
export const BodyToggleCell = styled(BodyCell)`
	width: 20px;
`;
export const BodyAction = styled(BodyCell)`
	width: 20px;
`;
