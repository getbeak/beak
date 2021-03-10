import styled from 'styled-components';

export const Row = styled.div<{ cols: number }>`
	display: grid;
	grid-template-columns: repeat(${p => p.cols}, 1fr);
	grid-auto-rows: auto;

	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
`;

export const Header = styled.div``;

export const Body = styled.div``;
