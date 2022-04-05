import styled from 'styled-components';

export const Row = styled.div<{ $cols: number }>`
	display: grid;
	grid-template-columns: minmax(120px, .9fr) repeat(${p => p.$cols}, minmax(140px, 1fr)) minmax(120px, .9fr);
	grid-auto-rows: auto;
`;

export const Header = styled.div`
	display: inline-block;
	position: sticky;
	top: 0;
	z-index: 10;
	background-color: ${props => props.theme.ui.surface};
	min-width: 100%;

	> ${Row} {
		background-color: ${props => props.theme.ui.surface};
	}
`;

export const HeaderAction = styled.div`
	display: inline-block;
	margin-left: 8px;
`;

export const Body = styled.div`
	z-index: 9;
`;
