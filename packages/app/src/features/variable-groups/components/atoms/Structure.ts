import styled from 'styled-components';

export const Row = styled.div<{ cols: number }>`
	display: grid;
	grid-template-columns: minmax(120px, .9fr) repeat(${p => p.cols}, minmax(140px, 1fr));
	grid-auto-rows: auto;
`;

export const Header = styled.div`
	background-color: ${props => props.theme.ui.surface};
	position: sticky;
	top: 0;
	z-index: 10;
`;

export const Body = styled.div`
	z-index: 9;
`;
