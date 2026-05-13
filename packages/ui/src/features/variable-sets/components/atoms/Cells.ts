import styled from 'styled-components';

export const Cell = styled.div`
	border-bottom: 1px solid var(--beak-colors-border-default);
`;

export const CellAction = styled.div`
	display: inline-block;
	padding: 0 4px;
	cursor: pointer;
`;

export const HeaderCell = styled(Cell)`
	color: var(--beak-colors-fg-default);
	border-left: 1px solid var(--beak-colors-border-default);
`;
export const HeaderNameCell = styled(HeaderCell)`
	border-left: none;

	> input {
		color: var(--beak-colors-fg-default);
	}
`;
export const HeaderGroupNameCell = styled(HeaderCell)`
	display: flex;
	flex-direction: row;
`;

export const BodyCell = styled(Cell)`
	border-left: 1px solid var(--beak-colors-border-default);
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

		color: var(--beak-colors-fg-muted);
	}
`;
